# ZERO E-COMMERCE - DATABASE ERD

**Version**: 2.0
**Date**: November 7, 2025 (Major Update - Restructured Prescription System)
**Purpose**: Visual Entity Relationship Diagram for ZERO MVP Database

**Recent Changes**:
- ✨ **NEW**: 4 admin-editable prescription tables (Nov 7, 2025):
  - `PRESCRIPTION_TYPES` - Prescription categories
  - `LENS_TYPES` - Lens materials/features (replaces LENS_TREATMENTS)
  - `LENS_INDEXES` - Lens thickness options
  - `VIEW_AREAS` - Progressive lens view areas
- ⚠️ **DEPRECATED**: LENS_OPTIONS and LENS_TREATMENTS (marked for cleanup)
- Enhanced prescription tables with foreign key references

---

## How to View This Diagram

1. **VS Code/GitHub IDE**: Right-click this file → "Open Preview"
2. **GitHub**: Push to GitHub - it will render automatically
3. **Mermaid Live Editor**: Copy the mermaid code block to https://mermaid.live

---

## Database Entity Relationship Diagram

```mermaid
erDiagram
    %% ============================================
    %% ZERO E-COMMERCE - DATABASE ERD
    %% ============================================

    %% Authentication & Users Domain
    AUTH_USERS ||--|| USERS : "extends"
    USERS ||--o{ ADDRESSES : "has many"
    USERS ||--o{ CART_ITEMS : "has many"
    USERS ||--o{ ORDERS : "places"
    USERS ||--o{ WISHLISTS : "has many"
    USERS ||--o{ PRODUCT_REVIEWS : "writes"
    USERS ||--o{ CONTACT_SUBMISSIONS : "submits"

    %% Product Catalog Domain
    BRANDS ||--o{ PRODUCTS : "has many"
    CATEGORIES ||--o{ PRODUCTS : "contains"
    FRAME_MATERIALS ||--o{ PRODUCTS : "used in"
    FRAME_SHAPES ||--o{ PRODUCTS : "defines"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has many"

    %% Prescription Configuration (Nov 7, 2025)
    PRESCRIPTION_TYPES : "Admin-editable prescription categories"
    LENS_TYPES : "Admin-editable lens materials and features"
    LENS_INDEXES : "Admin-editable lens thickness options"
    VIEW_AREAS : "Admin-editable progressive view areas"

    %% DEPRECATED: Product & Treatments (Many-to-Many)
    PRODUCTS ||--o{ PRODUCT_LENS_TREATMENTS : "offers (DEPRECATED)"
    LENS_TREATMENTS ||--o{ PRODUCT_LENS_TREATMENTS : "available for (DEPRECATED)"

    %% Shopping Cart Domain
    CART_ITEMS }o--|| PRODUCTS : "contains"
    CART_ITEMS ||--o| CART_ITEM_PRESCRIPTIONS : "may have"
    CART_ITEM_PRESCRIPTIONS }o--o| PRESCRIPTION_TYPES : "references"
    CART_ITEM_PRESCRIPTIONS }o--o| LENS_TYPES : "references"
    CART_ITEM_PRESCRIPTIONS }o--o| LENS_INDEXES : "references"
    CART_ITEM_PRESCRIPTIONS }o--o| VIEW_AREAS : "references"
    CART_ITEMS ||--o{ CART_ITEM_TREATMENTS : "has (DEPRECATED)"
    LENS_TREATMENTS ||--o{ CART_ITEM_TREATMENTS : "selected in (DEPRECATED)"

    %% Orders Domain
    ORDERS }o--o| ADDRESSES : "ships to"
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "tracks"
    ORDER_ITEMS }o--|| PRODUCTS : "references"
    ORDER_ITEMS ||--o| ORDER_ITEM_PRESCRIPTIONS : "may have"
    ORDER_ITEMS ||--o{ ORDER_ITEM_TREATMENTS : "includes"
    LENS_TREATMENTS ||--o{ ORDER_ITEM_TREATMENTS : "applied to"

    %% Prescription Validation (Admin)
    USERS ||--o{ ORDER_ITEM_PRESCRIPTIONS : "validates"

    %% Inventory & ERP Domain
    PRODUCTS ||--o{ INVENTORY_MOVEMENTS : "tracked by"
    ORDERS ||--o{ INVENTORY_MOVEMENTS : "affects"
    ERP_SYNC_LOGS ||--o{ ERP_SYNC_ERRORS : "records"
    ERP_SYNC_LOGS ||--o{ INVENTORY_MOVEMENTS : "creates"

    %% Customer Engagement (P2)
    WISHLISTS }o--|| PRODUCTS : "saves"
    PRODUCT_REVIEWS }o--|| PRODUCTS : "reviews"
    PRODUCT_REVIEWS }o--|| ORDERS : "verified by"

    %% Support
    USERS ||--o{ CONTACT_SUBMISSIONS : "assigns to admin"

    %% ============================================
    %% TABLE DEFINITIONS
    %% ============================================

    AUTH_USERS {
        uuid id PK
        string email UK
        string encrypted_password
        timestamp email_confirmed_at
        timestamp created_at
        timestamp last_sign_in_at
        string role
    }

    USERS {
        uuid id PK,FK
        string name
        string phone
        string country "REQUIRED"
        boolean is_admin
        timestamp created_at
        timestamp updated_at
    }

    ADDRESSES {
        uuid id PK
        uuid user_id FK
        string full_name
        string phone
        string country "REQUIRED"
        string address_line_1
        string address_line_2
        string city
        string state_province
        string postal_code
        boolean is_default
        timestamp created_at
        timestamp updated_at
    }

    BRANDS {
        uuid id PK
        string name UK
        string slug UK
        string logo_url
        timestamp created_at
    }

    CATEGORIES {
        uuid id PK
        string name
        string slug UK
        string description
        integer display_order
        timestamp created_at
    }

    FRAME_MATERIALS {
        uuid id PK
        string name UK
        timestamp created_at
    }

    FRAME_SHAPES {
        uuid id PK
        string name UK
        timestamp created_at
    }

    PRODUCTS {
        uuid id PK
        string sku UK
        string name
        string description
        decimal price "USD"
        uuid brand_id FK
        uuid category_id FK
        uuid frame_material_id FK
        uuid frame_shape_id FK
        integer lens_width "mm"
        integer bridge_width "mm"
        integer temple_length "mm"
        integer stock_quantity
        integer low_stock_threshold
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        string image_url
        integer display_order
        boolean is_primary
        timestamp created_at
    }

    LENS_TREATMENTS {
        uuid id PK
        string name
        string description
        decimal base_price "USD"
        boolean is_active
        integer display_order
        timestamp created_at
    }

    PRODUCT_LENS_TREATMENTS {
        uuid product_id PK,FK
        uuid treatment_id PK,FK
        decimal price_override "optional"
        timestamp created_at
    }

    CART_ITEMS {
        uuid id PK
        uuid user_id FK "NOT NULL - login required"
        uuid product_id FK
        integer quantity
        timestamp created_at
    }

    CART_ITEM_PRESCRIPTIONS {
        uuid id PK
        uuid cart_item_id FK,UK
        boolean has_prescription
        decimal od_sph
        decimal od_cyl
        integer od_axis
        decimal os_sph
        decimal os_cyl
        integer os_axis
        decimal pd
        decimal pd_dual_od
        decimal pd_dual_os
        decimal add_value
        string prescription_image_url
        timestamp created_at
    }

    CART_ITEM_TREATMENTS {
        uuid cart_item_id PK,FK
        uuid treatment_id PK,FK
        timestamp created_at
    }

    ORDERS {
        uuid id PK
        string order_number UK
        uuid user_id FK "NOT NULL - login required"
        string status "enum"
        uuid shipping_address_id FK
        jsonb shipping_address_snapshot
        string shipping_method
        decimal shipping_cost
        decimal subtotal
        decimal treatments_cost
        decimal total
        string payment_method
        string payment_status "enum"
        string payment_transaction_id
        string tracking_number
        string tracking_carrier
        date estimated_delivery_date
        timestamp created_at
        timestamp updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK "nullable if deleted"
        jsonb product_snapshot
        integer quantity
        decimal unit_price
        decimal subtotal
        timestamp created_at
    }

    ORDER_ITEM_PRESCRIPTIONS {
        uuid id PK
        uuid order_item_id FK,UK
        boolean has_prescription
        decimal od_sph
        decimal od_cyl
        integer od_axis
        decimal os_sph
        decimal os_cyl
        integer os_axis
        decimal pd
        decimal pd_dual_od
        decimal pd_dual_os
        decimal add_value
        string prescription_image_url
        string validation_status "enum"
        uuid validated_by_user_id FK
        timestamp validated_at
        string validation_notes
        timestamp created_at
    }

    ORDER_ITEM_TREATMENTS {
        uuid order_item_id PK,FK
        uuid treatment_id PK,FK
        string treatment_name "snapshot"
        decimal treatment_price "snapshot"
        timestamp created_at
    }

    ORDER_STATUS_HISTORY {
        uuid id PK
        uuid order_id FK
        string from_status
        string to_status
        uuid changed_by_user_id FK
        string notes
        string tracking_number
        timestamp created_at
    }

    INVENTORY_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        string movement_type "enum"
        integer quantity_change
        integer quantity_after
        uuid reference_id "order_id or sync_log_id"
        string reason
        uuid created_by_user_id FK
        timestamp created_at
    }

    ERP_SYNC_LOGS {
        uuid id PK
        string sync_type "enum"
        string status "enum"
        timestamp started_at
        timestamp completed_at
        integer duration_seconds
        integer total_records_fetched
        integer records_processed
        integer records_updated
        integer records_skipped
        integer error_count
        timestamp created_at
    }

    ERP_SYNC_ERRORS {
        uuid id PK
        uuid sync_log_id FK
        string product_sku
        string error_message
        jsonb error_details
        timestamp created_at
    }

    WISHLISTS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        timestamp created_at
    }

    PRODUCT_REVIEWS {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        uuid order_id FK
        integer rating "1-5"
        string title
        string review_text
        boolean is_approved
        uuid approved_by_user_id FK
        timestamp approved_at
        timestamp created_at
        timestamp updated_at
    }

    CONTACT_SUBMISSIONS {
        uuid id PK
        uuid user_id FK "nullable"
        string name
        string email
        string country "REQUIRED"
        string subject
        string message
        string status "enum"
        uuid assigned_to_user_id FK
        timestamp created_at
        timestamp resolved_at
    }
```

---

## Legend

**Relationship Notation:**
- `||--||` : One to exactly one
- `||--o{` : One to zero or more
- `}o--||` : Zero or more to exactly one
- `||--o|` : One to zero or one (optional)

**Field Notation:**
- `PK` : Primary Key
- `FK` : Foreign Key
- `UK` : Unique Key

---

## Key Relationships Explained

### One-to-One Relationships
- `CART_ITEMS ||--o| CART_ITEM_PRESCRIPTIONS` - Each cart item has at most one prescription
- `ORDER_ITEMS ||--o| ORDER_ITEM_PRESCRIPTIONS` - Each order item has at most one prescription
- `AUTH_USERS ||--|| USERS` - Each auth user has exactly one extended profile

### One-to-Many Relationships
- `USERS ||--o{ ADDRESSES` - Each user can have multiple addresses
- `USERS ||--o{ ORDERS` - Each user can place multiple orders
- `ORDERS ||--o{ ORDER_ITEMS` - Each order contains multiple items
- `PRODUCTS ||--o{ PRODUCT_IMAGES` - Each product has multiple images

### Many-to-Many Relationships
- `PRODUCTS ↔ LENS_TREATMENTS` (via `PRODUCT_LENS_TREATMENTS`)
- `CART_ITEMS ↔ LENS_TREATMENTS` (via `CART_ITEM_TREATMENTS`)
- `ORDER_ITEMS ↔ LENS_TREATMENTS` (via `ORDER_ITEM_TREATMENTS`)

---

## Domain Groupings

### 🔐 Authentication & Users (2 tables)
- `AUTH_USERS` (Supabase managed)
- `USERS`

### 📦 Product Catalog (8 tables)
- `BRANDS`
- `CATEGORIES`
- `FRAME_MATERIALS`
- `FRAME_SHAPES`
- `PRODUCTS`
- `PRODUCT_IMAGES`
- `LENS_TREATMENTS`
- `PRODUCT_LENS_TREATMENTS`

### 🛒 Shopping Cart (3 tables)
- `CART_ITEMS`
- `CART_ITEM_PRESCRIPTIONS`
- `CART_ITEM_TREATMENTS`

### 📋 Orders & Transactions (5 tables)
- `ORDERS`
- `ORDER_ITEMS`
- `ORDER_ITEM_PRESCRIPTIONS`
- `ORDER_ITEM_TREATMENTS`
- `ORDER_STATUS_HISTORY`

### 📊 Inventory & ERP (3 tables)
- `INVENTORY_MOVEMENTS`
- `ERP_SYNC_LOGS`
- `ERP_SYNC_ERRORS`

### ⭐ Customer Engagement - P2 (2 tables)
- `WISHLISTS`
- `PRODUCT_REVIEWS`

### 💬 Support (1 table)
- `CONTACT_SUBMISSIONS`

### 📍 Shared (1 table)
- `ADDRESSES`

---

**Total Tables**: 23

**End of ERD Document**
