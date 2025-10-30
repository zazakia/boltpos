import { UnitOfMeasure } from '@/lib/supabase';

/**
 * Convert quantity from one UOM to base UOM
 * @param quantity - The quantity in the source UOM
 * @param uom - The unit of measure being converted
 * @param uomList - The list of available UOMs for the product
 * @returns The quantity in base UOM
 */
export function convertToBaseUOM(
  quantity: number,
  uom: string,
  uomList: UnitOfMeasure[]
): number {
  const uomItem = uomList.find((u) => u.name === uom);
  if (!uomItem) {
    throw new Error(`UOM "${uom}" not found in product UOM list`);
  }
  return quantity * uomItem.conversion_to_base;
}

/**
 * Convert quantity from base UOM to target UOM
 * @param baseQuantity - The quantity in base UOM
 * @param targetUom - The target unit of measure
 * @param uomList - The list of available UOMs for the product
 * @returns The quantity in target UOM
 */
export function convertFromBaseUOM(
  baseQuantity: number,
  targetUom: string,
  uomList: UnitOfMeasure[]
): number {
  const uomItem = uomList.find((u) => u.name === targetUom);
  if (!uomItem) {
    throw new Error(`UOM "${targetUom}" not found in product UOM list`);
  }
  return baseQuantity / uomItem.conversion_to_base;
}

/**
 * Convert quantity from one UOM to another UOM
 * @param quantity - The quantity in source UOM
 * @param fromUom - The source unit of measure
 * @param toUom - The target unit of measure
 * @param uomList - The list of available UOMs for the product
 * @returns The quantity in target UOM
 */
export function convertBetweenUOMs(
  quantity: number,
  fromUom: string,
  toUom: string,
  uomList: UnitOfMeasure[]
): number {
  // First convert to base UOM
  const baseQuantity = convertToBaseUOM(quantity, fromUom, uomList);
  // Then convert from base to target UOM
  return convertFromBaseUOM(baseQuantity, toUom, uomList);
}

/**
 * Get the conversion rate for a UOM
 * @param uom - The unit of measure
 * @param uomList - The list of available UOMs for the product
 * @returns The conversion rate to base UOM
 */
export function getConversionRate(
  uom: string,
  uomList: UnitOfMeasure[]
): number {
  const uomItem = uomList.find((u) => u.name === uom);
  if (!uomItem) {
    throw new Error(`UOM "${uom}" not found in product UOM list`);
  }
  return uomItem.conversion_to_base;
}

/**
 * Get the base UOM from a UOM list
 * @param uomList - The list of available UOMs for the product
 * @returns The base UOM
 */
export function getBaseUOM(uomList: UnitOfMeasure[]): UnitOfMeasure {
  const baseUom = uomList.find((u) => u.is_base);
  if (!baseUom) {
    throw new Error('No base UOM found in product UOM list');
  }
  return baseUom;
}

/**
 * Validate if a UOM exists in the product's UOM list
 * @param uom - The unit of measure to validate
 * @param uomList - The list of available UOMs for the product
 * @returns True if valid, false otherwise
 */
export function isValidUOM(uom: string, uomList: UnitOfMeasure[]): boolean {
  return uomList.some((u) => u.name === uom);
}

/**
 * Format UOM display string with conversion rate
 * @param uom - The unit of measure
 * @param uomList - The list of available UOMs for the product
 * @returns Formatted string like "sack (50 kilos)"
 */
export function formatUOMDisplay(
  uom: string,
  uomList: UnitOfMeasure[]
): string {
  const uomItem = uomList.find((u) => u.name === uom);
  if (!uomItem) {
    return uom;
  }

  if (uomItem.is_base) {
    return uom;
  }

  const baseUom = getBaseUOM(uomList);
  return `${uom} (${uomItem.conversion_to_base} ${baseUom.name})`;
}

/**
 * Create a default UOM list with a single base unit
 * @param baseUomName - The name of the base unit (e.g., "piece", "kilo", "liter")
 * @returns A UOM list with one base unit
 */
export function createDefaultUOMList(baseUomName: string): UnitOfMeasure[] {
  return [
    {
      name: baseUomName,
      conversion_to_base: 1,
      is_base: true,
    },
  ];
}

/**
 * Add a new UOM to an existing UOM list
 * @param uomList - The existing UOM list
 * @param name - The name of the new UOM
 * @param conversionToBase - The conversion rate to base UOM
 * @returns The updated UOM list
 */
export function addUOMToList(
  uomList: UnitOfMeasure[],
  name: string,
  conversionToBase: number
): UnitOfMeasure[] {
  // Check if UOM already exists
  if (uomList.some((u) => u.name === name)) {
    throw new Error(`UOM "${name}" already exists in the list`);
  }

  return [
    ...uomList,
    {
      name,
      conversion_to_base: conversionToBase,
      is_base: false,
    },
  ];
}

/**
 * Remove a UOM from an existing UOM list
 * @param uomList - The existing UOM list
 * @param name - The name of the UOM to remove
 * @returns The updated UOM list
 */
export function removeUOMFromList(
  uomList: UnitOfMeasure[],
  name: string
): UnitOfMeasure[] {
  const uomToRemove = uomList.find((u) => u.name === name);

  if (!uomToRemove) {
    throw new Error(`UOM "${name}" not found in the list`);
  }

  if (uomToRemove.is_base) {
    throw new Error('Cannot remove the base UOM');
  }

  return uomList.filter((u) => u.name !== name);
}

/**
 * Update a UOM in an existing UOM list
 * @param uomList - The existing UOM list
 * @param name - The name of the UOM to update
 * @param conversionToBase - The new conversion rate
 * @returns The updated UOM list
 */
export function updateUOMInList(
  uomList: UnitOfMeasure[],
  name: string,
  conversionToBase: number
): UnitOfMeasure[] {
  const uomToUpdate = uomList.find((u) => u.name === name);

  if (!uomToUpdate) {
    throw new Error(`UOM "${name}" not found in the list`);
  }

  if (uomToUpdate.is_base && conversionToBase !== 1) {
    throw new Error('Base UOM must have conversion rate of 1');
  }

  return uomList.map((u) =>
    u.name === name ? { ...u, conversion_to_base: conversionToBase } : u
  );
}

/**
 * Calculate the total quantity in base UOM from multiple line items
 * @param items - Array of items with quantity and UOM
 * @param uomList - The list of available UOMs for the product
 * @returns Total quantity in base UOM
 */
export function calculateTotalBaseQuantity(
  items: Array<{ quantity: number; uom: string }>,
  uomList: UnitOfMeasure[]
): number {
  return items.reduce((total, item) => {
    return total + convertToBaseUOM(item.quantity, item.uom, uomList);
  }, 0);
}
