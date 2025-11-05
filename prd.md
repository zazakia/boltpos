# Product Requirements Document (PRD)
## InventoryPro - Inventory Management & POS System

**Version:** 1.0  
**Last Updated:** November 2025  
**Status:** Active Development

---

## 1. Executive Summary

InventoryPro is a comprehensive inventory management and Point of Sale (POS) system designed for soft drinks wholesale delivery companies in the Philippines. The system provides real-time inventory tracking, supplier management, order fulfillment, and integrated POS capabilities—all in a single, user-friendly platform using Philippine Peso (₱) as the default currency.

**Key Objectives:**
- Centralize inventory data across multiple warehouses
- Streamline procurement and supplier relationships
- Monitor product expiration and stock health
- Integrate sales operations with inventory management
- Provide actionable insights through analytics and reports

---

## 2. User Personas

### 2.1 Warehouse Manager
- **Goals:** Monitor stock levels, manage inventory movement, ensure product quality
- **Pain Points:** Manual tracking, expiration date management, stock discrepancies
- **Key Features Used:** Inventory dashboard, alerts, expiration tracking, reports

### 2.2 Sales Representative / POS Operator
- **Goals:** Process sales quickly, manage customer orders, handle returns
- **Pain Points:** Slow checkout, inventory visibility, payment processing
- **Key Features Used:** POS module, product search, unit of measure selection, order management

### 2.3 Procurement Manager
- **Goals:** Manage supplier relationships, optimize purchases, track orders
- **Pain Points:** Purchase order tracking, supplier communication, cost management
- **Key Features Used:** Supplier management, purchase orders, order status tracking

### 2.4 Operations Manager
- **Goals:** Monitor overall business performance, identify trends, optimize operations
- **Pain Points:** Data scattered across systems, slow reporting, limited insights
- **Key Features Used:** Dashboard analytics, reports, alerts, performance metrics

---

## 3. Core Features & Modules

### 3.1 Dashboard & Analytics
- **Real-time KPI cards:**
  - Total products count with active status
  - Total stock units across all warehouses
  - Active orders count with delivery rate
  - Inventory value in Philippine Peso (₱)
  - Today's POS sales transactions and revenue

- **Analytics widgets:**
  - Low stock alerts with shortage indicators
  - Items expiring within 30 days with batch details
  - Top 5 selling products with revenue breakdown
  - Warehouse utilization percentage with capacity tracking
  - Recent orders with customer and delivery information

### 3.2 Product Management
- **CRUD Operations:**
  - Create products with name, description, category, image
  - Edit product details and pricing
  - Delete inactive products
  - Set minimum stock levels for reordering

- **Unit of Measure (UOM):**
  - Define base UOM (e.g., bottle, can, carton)
  - Add alternate UOMs with conversion factors (e.g., 6 bottles = 1 pack)
  - Set pricing for each UOM
  - Support for multiple UOMs per product

- **Product Status:**
  - Active/Inactive status tracking
  - Category-based filtering (Carbonated, Juices, Energy Drinks, etc.)

### 3.3 Inventory Management
- **Batch Tracking:**
  - Create inventory batches with:
    - Batch number (unique identifier)
    - Warehouse location
    - Quantity received
    - Unit cost price
    - Expiration date
    - Receiving date

- **Stock Movements:**
  - Add new stock (purchase receipt)
  - Deduct stock (sales/adjustments)
  - Transfer between warehouses
  - View complete movement history

- **FIFO (First In First Out):**
  - Automatic FIFO-based inventory deduction for POS sales
  - Prioritize expiring items first
  - Maintain product quality standards

### 3.4 Warehouse Management
- **Warehouse Details:**
  - Name, location, manager
  - Storage capacity (max units)
  - Current utilization tracking
  - Utilization alerts (60%+, 80%+)

- **Warehouse Monitoring:**
  - Real-time capacity status
  - Product distribution across locations
  - Utilization percentage visualization

### 3.5 Supplier Management
- **Supplier Information:**
  - Company name and contact details
  - Contact person name and phone
  - Email address
  - Payment terms (Net 15, Net 30, Net 60, COD)
  - Status (Active/Inactive)

- **CRUD Operations:**
  - Create new supplier records
  - Edit contact and payment information
  - Delete suppliers (soft delete for inactive)
  - Search and filter by status

### 3.6 Purchase Order Management
- **Purchase Order Creation:**
  - Select supplier
  - Add multiple products with quantities and unit prices
  - Set expected delivery date
  - Add notes/special instructions

- **PO Status Workflow:**
  - **Draft:** Initial creation
  - **Pending:** Submitted to supplier
  - **Ordered:** Confirmed by supplier
  - **Received:** Stock added to inventory
  - **Cancelled:** Order cancelled

- **Automatic Inventory Creation:**
  - When PO status changes to "Received"
  - System creates inventory batches for each product
  - Auto-calculates expiration date based on product shelf life
  - Assigns to specified warehouse

- **PO Management:**
  - View all purchase orders with supplier info
  - Filter by status and date range
  - Calculate total PO amount
  - Edit PO in Draft/Pending status
  - Cancel PO with reason

### 3.7 Sales Orders
- **Sales Order Management:**
  - Create orders for customers
  - Add multiple products with quantities
  - Auto-calculate order total
  - Assign delivery warehouse
  - Set delivery date

- **Sales Order Status:**
  - **Draft:** Created but not sent
  - **Pending:** Ready for fulfillment
  - **Converted:** Converted to POS (fully saved)
  - **Cancelled:** Order cancelled

- **Order Monitoring:**
  - Track conversion status (shows if order was saved in POS)
  - View all orders with customer details
  - Filter by status and date
  - Edit orders in Draft/Pending status

### 3.8 POS (Point of Sale)
- **Modern Checkout Interface:**
  - Product grid with images and quick search
  - Real-time search by product name
  - Category filtering for quick navigation
  - Stock availability display per UOM

- **Shopping Cart:**
  - Add/remove items
  - Adjust quantities
  - Select unit of measure per item
  - Real-time total calculation

- **Payment Processing:**
  - Support multiple payment methods:
    - Cash
    - Card
    - Check
    - Online Transfer
  - Calculate change for cash payments
  - Apply tax calculation (12% VAT by default)

- **Receipt Management:**
  - Professional receipt preview
  - Display all items with UOM and price
  - Show subtotal, tax, and total
  - Print receipt functionality
  - Receipt number generation

- **Sales Order Integration:**
  - View pending sales orders for conversion
  - Convert sales orders to POS sales in bulk
  - Automatic inventory deduction using FIFO
  - Mark orders as "Converted" when saved to POS

- **Today's POS Summary:**
  - Total transactions count
  - Total revenue for the day
  - Average sale value
  - Real-time updates

### 3.9 Alerts & Monitoring
- **Alert Types:**
  - **Low Stock:** Products below minimum level
  - **Expiring Soon:** Items expiring within 30 days
  - **Expired:** Items past expiration date (critical)

- **Alert Management:**
  - View all active alerts
  - Filter by alert type and severity
  - Dismiss alerts
  - Take actions directly from alert:
    - Remove expired items
    - Reorder low stock products
    - View product/inventory details

- **Alert Notifications:**
  - Dashboard alert cards with counts
  - Status badges showing severity
  - Date-based filtering

### 3.10 Reports & Analytics
- **Inventory Reports:**
  - Stock level by product
  - Current inventory value
  - Warehouse utilization report
  - Batch/expiration tracking report
  - Stock movement history

- **Sales Reports:**
  - POS sales by date range
  - Best-selling products
  - Revenue by product/category
  - Sales order fulfillment status
  - Customer order history

- **Procurement Reports:**
  - Purchase order status summary
  - Supplier performance metrics
  - Cost analysis by supplier
  - Delivery timeline tracking

- **Export Functionality:**
  - CSV export for all reports
  - Date range filtering
  - Column selection for custom exports

---

## 4. Functional Requirements

### 4.1 Data Persistence
- **Browser-based Storage:**
  - All data stored in localStorage
  - Automatic data initialization on first load
  - Seed data for testing (8 products, 3 warehouses, sample orders)

### 4.2 Navigation
- **Sidebar Navigation:**
  - Fixed left sidebar on desktop
  - Collapsible on mobile (hamburger menu)
  - Module links:
    - Dashboard
    - Products
    - Inventory
    - Suppliers
    - Purchase Orders
    - Sales Orders
    - POS
    - Alerts
    - Reports
  - Active route highlighting
  - Brand/logo section at top

### 4.3 Currency & Localization
- **Philippine Peso (₱):**
  - All prices displayed with ₱ symbol
  - Thousand separators for large numbers
  - 2 decimal places for cents
  - Applied throughout:
    - Product pricing
    - Order totals
    - Inventory value
    - POS amounts
    - Reports

### 4.4 Search & Filter
- **Global Search:**
  - Product search by name
  - Supplier search by company name
  - Order search by order number
  - Batch search by batch number

- **Filtering Options:**
  - By status (active/inactive, draft/pending/delivered/cancelled)
  - By date range
  - By warehouse
  - By category
  - By alert type
  - By payment status

### 4.5 Data Validation
- **Input Validation:**
  - Required field enforcement
  - Email format validation
  - Phone number format validation
  - Quantity and price format validation
  - Expiration date validation (future date)
  - Conversion factor validation (>0)

- **Business Logic Validation:**
  - No duplicate product names
  - Minimum stock level > 0
  - Unit cost > 0
  - Warehouse capacity > current utilization
  - PO quantity matches received quantity for close
  - Sales order items must be in stock

### 4.6 Performance & UX
- **Loading States:**
  - Skeleton loaders for pages
  - Loading indicators for actions
  - Disabled buttons during operations

- **User Feedback:**
  - Success toast notifications
  - Error messages with solutions
  - Confirmation dialogs for destructive actions
  - Form validation errors
  - Empty states with helpful messages

---

## 5. Technical Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Charts:** Recharts
- **Date Utility:** date-fns

### Data Management
- **State Management:** React hooks + SWR
- **Data Storage:** Browser localStorage
- **Data Structure:** TypeScript interfaces

### Deployment
- **Platform:** Vercel
- **Runtime:** Next.js (Next.js)
- **Build Tool:** Turbopack

---

## 6. Data Models

### Product
\`\`\`
- id: string (UUID)
- name: string
- description: string
- category: string
- image: string (URL)
- basePrice: number (₱)
- basUOM: string (bottle/can/carton)
- alternateUOMs: Array<{name, quantity, conversionFactor, price}>
- minStockLevel: number
- shelfLife: number (days)
- status: 'active' | 'inactive'
- createdAt: ISO string
- updatedAt: ISO string
\`\`\`

### InventoryItem
\`\`\`
- id: string (UUID)
- productId: string
- warehouseId: string
- batchNumber: string
- quantity: number
- unitCost: number (₱)
- expiryDate: ISO string
- receivedDate: ISO string
- status: 'active' | 'expired'
\`\`\`

### Warehouse
\`\`\`
- id: string (UUID)
- name: string
- location: string
- manager: string
- capacity: number (max units)
- currentUtilization: number
\`\`\`

### Supplier
\`\`\`
- id: string (UUID)
- companyName: string
- contactPerson: string
- phone: string
- email: string
- paymentTerms: 'Net 15' | 'Net 30' | 'Net 60' | 'COD'
- status: 'active' | 'inactive'
\`\`\`

### PurchaseOrder
\`\`\`
- id: string (UUID)
- poNumber: string (auto-generated)
- supplierId: string
- items: Array<{productId, quantity, unitPrice}>
- totalAmount: number (₱)
- status: 'draft' | 'pending' | 'ordered' | 'received' | 'cancelled'
- expectedDeliveryDate: ISO string
- actualDeliveryDate: ISO string | null
- notes: string
- createdAt: ISO string
- updatedAt: ISO string
\`\`\`

### SalesOrder
\`\`\`
- id: string (UUID)
- orderNumber: string (auto-generated)
- customerName: string
- customerPhone: string
- customerEmail: string
- deliveryAddress: string
- items: Array<{productId, quantity, price}>
- warehouseId: string
- totalAmount: number (₱)
- status: 'draft' | 'pending' | 'converted' | 'cancelled'
- salesOrderStatus: 'pending' | 'converted'
- deliveryDate: ISO string
- createdAt: ISO string
\`\`\`

### POSSale
\`\`\`
- id: string (UUID)
- receiptNumber: string (auto-generated)
- items: Array<{productId, quantity, uom, unitPrice, subtotal}>
- subtotal: number (₱)
- tax: number (₱)
- totalAmount: number (₱)
- paymentMethod: 'cash' | 'card' | 'check' | 'transfer'
- amountReceived: number (₱)
- change: number (₱)
- createdAt: ISO string
- convertedFromOrderId: string | null
\`\`\`

---

## 7. User Workflows

### 7.1 Daily POS Operations
1. **Opening Inventory Check:**
   - View Dashboard for low stock and expiring items
   - Check warehouse utilization
   - Review pending alerts

2. **Process Customer Sale:**
   - Go to POS module
   - Search for products or browse by category
   - Select unit of measure for each item
   - Add items to cart
   - Verify total and select payment method
   - Process payment and print receipt
   - System automatically deducts inventory using FIFO

3. **End of Day:**
   - Review Today's POS Sales card
   - Export sales report
   - Monitor inventory changes

### 7.2 Purchase Order Management
1. **Create PO:**
   - Go to Purchase Orders
   - Select supplier
   - Add products with quantities
   - Set expected delivery date
   - Save as Draft

2. **Submit PO:**
   - Edit PO from Draft
   - Review details
   - Change status to "Pending"
   - Notify supplier

3. **Receive PO:**
   - Verify received items
   - Update status to "Received"
   - System automatically creates inventory batches
   - Confirm expiration dates

### 7.3 Inventory Monitoring
1. **Check Stock Levels:**
   - View Inventory page
   - Filter by warehouse or product
   - See all batches with expiration dates

2. **Add Stock Movement:**
   - Click "Add Stock" or "Adjust Stock"
   - Specify warehouse, quantity, and reason
   - System records movement in history

3. **Monitor Expiration:**
   - Check Alerts page
   - Review items expiring within 30 days
   - Remove expired items from shelf

### 7.4 Sales Order to POS Conversion
1. **Create Sales Order:**
   - Go to Sales Orders
   - Add customer details
   - Select products and quantities
   - Set delivery date and warehouse
   - Save as "Pending"

2. **Convert to POS:**
   - Go to POS module
   - View "Pending Sales Orders" section
   - Select orders to convert
   - Process through POS checkout
   - Orders marked as "Converted"

3. **Monitor Conversion:**
   - Sales Orders page shows "salesOrderStatus"
   - Track which orders were saved to POS
   - Generate reports on fulfillment rate

---

## 8. Success Metrics & KPIs

### Operational Metrics
- Inventory accuracy rate (target: 98%+)
- Stock-out prevention rate (target: 95%+)
- Order fulfillment time (target: < 24 hours)
- Expiration waste reduction (target: < 2%)

### POS Metrics
- Average transaction time (target: < 3 minutes)
- Daily transaction count
- Average transaction value
- Payment success rate (target: 99.5%+)

### Business Metrics
- Inventory turnover rate
- Supplier on-time delivery rate (target: 95%+)
- Warehouse utilization rate (target: 70-85%)
- Sales order conversion rate (target: 90%+)

### System Metrics
- Page load time (target: < 2 seconds)
- Data sync reliability (target: 100%)
- System uptime (target: 99.5%+)

---

## 9. Future Enhancements

### Phase 2
- [ ] Backend database integration (Supabase/Neon)
- [ ] User authentication and role-based access
- [ ] Multi-branch support with centralized reporting
- [ ] Mobile app for warehouse staff
- [ ] Barcode/QR code scanning for inventory
- [ ] Email notifications for alerts
- [ ] Advanced reporting with custom dashboards

### Phase 3
- [ ] Accounting integration (invoicing/billing)
- [ ] Customer loyalty program
- [ ] Route optimization for delivery
- [ ] Supplier portal
- [ ] Demand forecasting with AI
- [ ] Automated reordering
- [ ] API for third-party integrations

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **FIFO** | First In, First Out - inventory valuation method |
| **PO** | Purchase Order - request for goods from supplier |
| **UOM** | Unit of Measure - quantity unit (bottle, case, etc.) |
| **SKU** | Stock Keeping Unit - product identifier |
| **₱** | Philippine Peso - currency symbol |
| **Batch** | Group of items received together with same expiration date |
| **Conversion Rate** | Factor to convert between UOMs (e.g., 6 bottles = 1 pack) |
| **Utilization** | Percentage of warehouse capacity currently in use |
| **Fulfillment** | Process of completing a customer order |

---

## 11. Appendix

### A. Standard Reports Included
1. Inventory Valuation Report
2. Low Stock Alert Report
3. Expiration Tracking Report
4. Sales by Product Report
5. Warehouse Utilization Report
6. POS Daily Summary
7. Purchase Order Status Report
8. Supplier Performance Report

### B. Default Configuration
- **Default Tax Rate:** 12% (Philippine VAT)
- **Default Currency:** Philippine Peso (₱)
- **Stock Alert Threshold:** 30 days expiration
- **Low Stock Threshold:** Below minimum stock level
- **Warehouse Capacity Alert:** 60% (yellow), 80% (red)

### C. Contact & Support
For inquiries or feature requests, contact the development team at inventory-pro@company.com

---

**End of PRD Document**
