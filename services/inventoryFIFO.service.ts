// FIFO Inventory Service for InventoryPro
// Implements First-In-First-Out inventory deduction logic

import { InventoryItem, POSSale, POSSaleItem, Product } from '@/types/inventory';
import { dataManagerService } from './dataManager.service';

export interface FIFODeductionResult {
  success: boolean;
  deductions: Array<{
    batchId: string;
    productId: string;
    quantityDeducted: number;
    remainingStock: number;
  }>;
  totalDeducted: number;
  error?: string;
}

export interface BatchInfo {
  batch: InventoryItem;
  remainingQuantity: number;
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
}

export class InventoryFIFOService {
  /**
   * Deduct inventory using FIFO logic for a POS sale
   */
  static async deductInventoryForSale(sale: POSSale): Promise<FIFODeductionResult> {
    try {
      console.log(`POS: Starting FIFO deduction for sale ${sale.id}`);
      
      const deductions: FIFODeductionResult['deductions'] = [];
      let totalDeducted = 0;

      // Process each item in the sale
      for (const item of sale.items) {
        const deduction = await this.deductSingleProduct(item);
        if (!deduction.success) {
          return {
            success: false,
            deductions: [],
            totalDeducted: 0,
            error: deduction.error,
          };
        }

        deductions.push(...deduction.deductions);
        totalDeducted += deduction.totalDeducted;
      }

      console.log(`POS: FIFO deduction completed successfully. Total deducted: ${totalDeducted}`);

      return {
        success: true,
        deductions,
        totalDeducted,
      };

    } catch (error) {
      console.error('POS: FIFO deduction failed:', error);
      return {
        success: false,
        deductions: [],
        totalDeducted: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Deduct inventory for a single product using FIFO logic
   */
  private static async deductSingleProduct(item: POSSaleItem): Promise<FIFODeductionResult> {
    try {
      // Get product details
      const productResult = await dataManagerService.getProductById(item.productId);
      if (!productResult.data) {
        return {
          success: false,
          deductions: [],
          totalDeducted: 0,
          error: `Product not found: ${item.productId}`,
        };
      }

      const product = productResult.data;
      
      // Convert UOM to base UOM for inventory tracking
      const baseUOMQuantity = this.convertUOMToBase(item, product);
      if (baseUOMQuantity <= 0) {
        return {
          success: false,
          deductions: [],
          totalDeducted: 0,
          error: `Invalid quantity for product ${product.name}`,
        };
      }

      // Get all active inventory batches for this product, sorted by FIFO (oldest first)
      const inventoryResult = await this.getProductInventoryByFIFO(item.productId);
      if (!inventoryResult.success || !inventoryResult.data) {
        return {
          success: false,
          deductions: [],
          totalDeducted: 0,
          error: `No inventory found for product ${product.name}`,
        };
      }

      const batches = inventoryResult.data;
      let remainingToDeduct = baseUOMQuantity;
      const deductions: FIFODeductionResult['deductions'] = [];

      // Deduct from oldest batches first (FIFO logic)
      for (const batchInfo of batches) {
        if (remainingToDeduct <= 0) break;

        const { batch, remainingQuantity } = batchInfo;
        
        // Calculate how much to deduct from this batch
        const quantityToDeduct = Math.min(remainingToDeduct, remainingQuantity);
        
        if (quantityToDeduct > 0) {
          // Update the batch quantity
          const updateResult = await this.updateBatchQuantity(batch.id, remainingQuantity - quantityToDeduct);
          
          if (updateResult.success) {
            deductions.push({
              batchId: batch.id,
              productId: item.productId,
              quantityDeducted: quantityToDeduct,
              remainingStock: remainingQuantity - quantityToDeduct,
            });

            remainingToDeduct -= quantityToDeduct;
          } else {
            return {
              success: false,
              deductions: [],
              totalDeducted: 0,
              error: `Failed to update batch ${batch.batchNumber}`,
            };
          }
        }
      }

      // Check if we had enough inventory
      if (remainingToDeduct > 0) {
        const totalAvailable = batches.reduce((sum, batch) => sum + batch.remainingQuantity, 0);
        return {
          success: false,
          deductions: [],
          totalDeducted: 0,
          error: `Insufficient inventory for ${product.name}. Needed: ${baseUOMQuantity}, Available: ${totalAvailable}`,
        };
      }

      console.log(`POS: Deducted ${baseUOMQuantity} units of ${product.name} using FIFO`);

      return {
        success: true,
        deductions,
        totalDeducted: baseUOMQuantity,
      };

    } catch (error) {
      return {
        success: false,
        deductions: [],
        totalDeducted: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Convert UOM quantity to base UOM for inventory tracking
   */
  private static convertUOMToBase(item: POSSaleItem, product: Product): number {
    if (item.uom === product.baseUOM.name) {
      return item.quantity;
    }

    // Find the alternate UOM
    const alternateUOM = product.alternateUOMs.find(u => u.name === item.uom);
    if (!alternateUOM) {
      console.warn(`POS: Unknown UOM ${item.uom} for product ${product.name}`);
      return item.quantity; // Fallback to raw quantity
    }

    // Convert using conversion factor
    return item.quantity * alternateUOM.conversionFactor;
  }

  /**
   * Get product inventory sorted by FIFO (oldest first)
   */
  private static async getProductInventoryByFIFO(productId: string): Promise<{
    success: boolean;
    data: BatchInfo[] | null;
    error?: string;
  }> {
    try {
      const inventoryResult = await dataManagerService.getInventoryByProduct(productId);
      if (!inventoryResult.data) {
        return {
          success: false,
          data: null,
          error: inventoryResult.error || 'Failed to get inventory',
        };
      }

      // Filter active batches only
      const activeBatches = inventoryResult.data.filter((batch: any) => batch.status === 'active');
      
      // Calculate days until expiry and sort by FIFO (oldest received first)
      const batchesWithExpiryInfo: BatchInfo[] = activeBatches
        .map((batch: any) => {
          const receivedDate = new Date(batch.receivedDate);
          const expiryDate = new Date(batch.expiryDate);
          const today = new Date();
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          return {
            batch,
            remainingQuantity: batch.quantity,
            daysUntilExpiry,
            isExpiringSoon: daysUntilExpiry <= 30 && daysUntilExpiry >= 0,
          };
        })
        .sort((a: BatchInfo, b: BatchInfo) => {
          // Sort by received date (oldest first) for FIFO
          return new Date(a.batch.receivedDate).getTime() - new Date(b.batch.receivedDate).getTime();
        });

      return {
        success: true,
        data: batchesWithExpiryInfo,
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update batch quantity in database
   */
  private static async updateBatchQuantity(batchId: string, newQuantity: number): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await dataManagerService.updateInventoryBatch(batchId, { quantity: newQuantity });
      return {
        success: !!result.data,
        error: result.error || undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get FIFO summary for a product
   */
  static async getFIFOSummary(productId: string): Promise<{
    success: boolean;
    data: {
      totalStock: number;
      activeBatches: number;
      expiredBatches: number;
      expiringBatches: number;
      oldestBatchDate: string | null;
      newestBatchDate: string | null;
      averageBatchAge: number;
    } | null;
    error?: string;
  }> {
    try {
      const inventoryResult = await dataManagerService.getInventoryByProduct(productId);
      if (!inventoryResult.data) {
        return {
          success: false,
          data: null,
          error: inventoryResult.error || 'Failed to get inventory',
        };
      }

      const batches = inventoryResult.data;
      const today = new Date();
      
      let totalStock = 0;
      let expiredBatches = 0;
      let expiringBatches = 0;
      let oldestDate: Date | null = null;
      let newestDate: Date | null = null;
      let totalBatchAge = 0;

      for (const batch of batches) {
        if (batch.status === 'active') {
          totalStock += batch.quantity;
          
          const receivedDate = new Date(batch.receivedDate);
          const expiryDate = new Date(batch.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry < 0) {
            expiredBatches++;
          } else if (daysUntilExpiry <= 30) {
            expiringBatches++;
          }

          // Track oldest and newest batch dates
          if (!oldestDate || receivedDate < oldestDate) {
            oldestDate = receivedDate;
          }
          if (!newestDate || receivedDate > newestDate) {
            newestDate = receivedDate;
          }

          // Calculate batch age
          const batchAge = Math.ceil((today.getTime() - receivedDate.getTime()) / (1000 * 60 * 60 * 24));
          totalBatchAge += batchAge;
        }
      }

      const activeBatches = batches.filter((b: any) => b.status === 'active').length;
      const averageBatchAge = activeBatches > 0 ? Math.round(totalBatchAge / activeBatches) : 0;

      return {
        success: true,
        data: {
          totalStock,
          activeBatches,
          expiredBatches,
          expiringBatches,
          oldestBatchDate: oldestDate?.toISOString() || null,
          newestBatchDate: newestDate?.toISOString() || null,
          averageBatchAge,
        },
      };

    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}