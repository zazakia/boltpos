# Product Overview

Bolt POS is a React Native mobile point-of-sale system built with Expo. It provides a modern, role-based POS solution for retail businesses with real-time inventory management, order processing, and multi-platform support (iOS, Android, Web).

## Key Features

- Role-based access control (Admin/Staff)
- Real-time inventory management with stock validation
- Order processing with multiple payment methods
- Product and category management
- Order history and status tracking
- Atomic stock operations with audit logging

## User Roles

- **Admin**: Full access to product management, category management, order status updates, and all POS features
- **Staff**: Access to POS interface, cart management, checkout, and viewing their own orders

## Business Logic

- Tax rate: Fixed 10% on all orders
- Currency: Philippine Peso (₱)
- Payment methods: Cash, Card, Mobile
- Order statuses: Completed, Refunded, Cancelled
- Stock validation prevents overselling
- Low stock warnings for inventory management
