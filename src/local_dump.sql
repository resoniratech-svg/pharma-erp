--
-- PostgreSQL database dump
--

\restrict swi6FlIF9x6sbEEAwU9dpKcUdShYJuOsMtyrA2kRGPBT50EsLDgDchwp4clcTxZ

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public."Warehouse" DROP CONSTRAINT "Warehouse_companyId_fkey";
ALTER TABLE ONLY public."WarehouseTransferItem" DROP CONSTRAINT "WarehouseTransferItem_warehouseTransferId_fkey";
ALTER TABLE ONLY public."WarehouseTransferItem" DROP CONSTRAINT "WarehouseTransferItem_productId_fkey";
ALTER TABLE ONLY public."WarehouseTransferItem" DROP CONSTRAINT "WarehouseTransferItem_batchId_fkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_companyId_fkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_branchId_fkey";
ALTER TABLE ONLY public."TransportChallan" DROP CONSTRAINT "TransportChallan_dispatchId_fkey";
ALTER TABLE ONLY public."TourPlan" DROP CONSTRAINT "TourPlan_mrId_fkey";
ALTER TABLE ONLY public."TourPlanDoctor" DROP CONSTRAINT "TourPlanDoctor_tourPlanId_fkey";
ALTER TABLE ONLY public."TourPlanDoctor" DROP CONSTRAINT "TourPlanDoctor_doctorId_fkey";
ALTER TABLE ONLY public."TourPlanChemist" DROP CONSTRAINT "TourPlanChemist_tourPlanId_fkey";
ALTER TABLE ONLY public."TourPlanChemist" DROP CONSTRAINT "TourPlanChemist_chemistId_fkey";
ALTER TABLE ONLY public."Target" DROP CONSTRAINT "Target_mrId_fkey";
ALTER TABLE ONLY public."StockMovement" DROP CONSTRAINT "StockMovement_inventoryId_fkey";
ALTER TABLE ONLY public."SchemeMaster" DROP CONSTRAINT "SchemeMaster_productId_fkey";
ALTER TABLE ONLY public."SchemeMaster" DROP CONSTRAINT "SchemeMaster_batchId_fkey";
ALTER TABLE ONLY public."RolePermission" DROP CONSTRAINT "RolePermission_featureId_fkey";
ALTER TABLE ONLY public."RolePermission" DROP CONSTRAINT "RolePermission_companyId_fkey";
ALTER TABLE ONLY public."Retailer" DROP CONSTRAINT "Retailer_stockistId_fkey";
ALTER TABLE ONLY public."RetailerOrder" DROP CONSTRAINT "RetailerOrder_stockistId_fkey";
ALTER TABLE ONLY public."RetailerOrder" DROP CONSTRAINT "RetailerOrder_retailerId_fkey";
ALTER TABLE ONLY public."RetailerOrder" DROP CONSTRAINT "RetailerOrder_mrId_fkey";
ALTER TABLE ONLY public."RetailerOrder" DROP CONSTRAINT "RetailerOrder_hospitalId_fkey";
ALTER TABLE ONLY public."RetailerOrder" DROP CONSTRAINT "RetailerOrder_chemistId_fkey";
ALTER TABLE ONLY public."RetailerOrderItem" DROP CONSTRAINT "RetailerOrderItem_retailerOrderId_fkey";
ALTER TABLE ONLY public."RetailerOrderItem" DROP CONSTRAINT "RetailerOrderItem_productId_fkey";
ALTER TABLE ONLY public."Product" DROP CONSTRAINT "Product_companyId_fkey";
ALTER TABLE ONLY public."Product" DROP CONSTRAINT "Product_categoryId_fkey";
ALTER TABLE ONLY public."PricingMaster" DROP CONSTRAINT "PricingMaster_productId_fkey";
ALTER TABLE ONLY public."PricingMaster" DROP CONSTRAINT "PricingMaster_batchId_fkey";
ALTER TABLE ONLY public."PaymentCollection" DROP CONSTRAINT "PaymentCollection_invoiceId_fkey";
ALTER TABLE ONLY public."OutwardStock" DROP CONSTRAINT "OutwardStock_warehouseId_fkey";
ALTER TABLE ONLY public."OutwardStockItem" DROP CONSTRAINT "OutwardStockItem_productId_fkey";
ALTER TABLE ONLY public."OutwardStockItem" DROP CONSTRAINT "OutwardStockItem_outwardStockId_fkey";
ALTER TABLE ONLY public."OutwardStockItem" DROP CONSTRAINT "OutwardStockItem_batchId_fkey";
ALTER TABLE ONLY public."Notification" DROP CONSTRAINT "Notification_mrId_fkey";
ALTER TABLE ONLY public."Meeting" DROP CONSTRAINT "Meeting_mrId_fkey";
ALTER TABLE ONLY public."Meeting" DROP CONSTRAINT "Meeting_doctorId_fkey";
ALTER TABLE ONLY public."Meeting" DROP CONSTRAINT "Meeting_chemistId_fkey";
ALTER TABLE ONLY public."MeetingStockist" DROP CONSTRAINT "MeetingStockist_stockistId_fkey";
ALTER TABLE ONLY public."MeetingStockist" DROP CONSTRAINT "MeetingStockist_meetingId_fkey";
ALTER TABLE ONLY public."MeetingHospital" DROP CONSTRAINT "MeetingHospital_meetingId_fkey";
ALTER TABLE ONLY public."MeetingHospital" DROP CONSTRAINT "MeetingHospital_hospitalId_fkey";
ALTER TABLE ONLY public."MeetingDoctor" DROP CONSTRAINT "MeetingDoctor_meetingId_fkey";
ALTER TABLE ONLY public."MeetingDoctor" DROP CONSTRAINT "MeetingDoctor_doctorId_fkey";
ALTER TABLE ONLY public."MeetingChemist" DROP CONSTRAINT "MeetingChemist_meetingId_fkey";
ALTER TABLE ONLY public."MeetingChemist" DROP CONSTRAINT "MeetingChemist_chemistId_fkey";
ALTER TABLE ONLY public."MR" DROP CONSTRAINT "MR_userId_fkey";
ALTER TABLE ONLY public."Ledger" DROP CONSTRAINT "Ledger_retailerId_fkey";
ALTER TABLE ONLY public."LeaveRequest" DROP CONSTRAINT "LeaveRequest_mrId_fkey";
ALTER TABLE ONLY public."Lead" DROP CONSTRAINT "Lead_assignedMrId_fkey";
ALTER TABLE ONLY public."LRTracking" DROP CONSTRAINT "LRTracking_transportChallanId_fkey";
ALTER TABLE ONLY public."InwardStock" DROP CONSTRAINT "InwardStock_warehouseId_fkey";
ALTER TABLE ONLY public."InwardStock" DROP CONSTRAINT "InwardStock_supplierId_fkey";
ALTER TABLE ONLY public."InwardStockItem" DROP CONSTRAINT "InwardStockItem_productId_fkey";
ALTER TABLE ONLY public."InwardStockItem" DROP CONSTRAINT "InwardStockItem_inwardStockId_fkey";
ALTER TABLE ONLY public."Invoice" DROP CONSTRAINT "Invoice_retailerId_fkey";
ALTER TABLE ONLY public."InvoiceItem" DROP CONSTRAINT "InvoiceItem_productId_fkey";
ALTER TABLE ONLY public."InvoiceItem" DROP CONSTRAINT "InvoiceItem_invoiceId_fkey";
ALTER TABLE ONLY public."Inventory" DROP CONSTRAINT "Inventory_warehouseId_fkey";
ALTER TABLE ONLY public."Inventory" DROP CONSTRAINT "Inventory_batchId_fkey";
ALTER TABLE ONLY public."FollowUp" DROP CONSTRAINT "FollowUp_mrId_fkey";
ALTER TABLE ONLY public."FollowUp" DROP CONSTRAINT "FollowUp_meetingId_fkey";
ALTER TABLE ONLY public."FollowUp" DROP CONSTRAINT "FollowUp_doctorId_fkey";
ALTER TABLE ONLY public."FollowUp" DROP CONSTRAINT "FollowUp_chemistId_fkey";
ALTER TABLE ONLY public."Feature" DROP CONSTRAINT "Feature_moduleId_fkey";
ALTER TABLE ONLY public."ExpenseClaim" DROP CONSTRAINT "ExpenseClaim_mrId_fkey";
ALTER TABLE ONLY public."DoctorVisit" DROP CONSTRAINT "DoctorVisit_mrId_fkey";
ALTER TABLE ONLY public."DoctorVisit" DROP CONSTRAINT "DoctorVisit_doctorId_fkey";
ALTER TABLE ONLY public."Dispatch" DROP CONSTRAINT "Dispatch_warehouseId_fkey";
ALTER TABLE ONLY public."Dispatch" DROP CONSTRAINT "Dispatch_batchId_fkey";
ALTER TABLE ONLY public."DeliveryTracking" DROP CONSTRAINT "DeliveryTracking_lrTrackingId_fkey";
ALTER TABLE ONLY public."DailyReport" DROP CONSTRAINT "DailyReport_mrId_fkey";
ALTER TABLE ONLY public."CreditNote" DROP CONSTRAINT "CreditNote_retailerId_fkey";
ALTER TABLE ONLY public."CreditNote" DROP CONSTRAINT "CreditNote_mrId_fkey";
ALTER TABLE ONLY public."CreditNote" DROP CONSTRAINT "CreditNote_distributorId_fkey";
ALTER TABLE ONLY public."CreditNote" DROP CONSTRAINT "CreditNote_approvedByUserId_fkey";
ALTER TABLE ONLY public."CreditNote" DROP CONSTRAINT "CreditNote_againstInvoiceId_fkey";
ALTER TABLE ONLY public."CreditNoteItem" DROP CONSTRAINT "CreditNoteItem_productId_fkey";
ALTER TABLE ONLY public."CreditNoteItem" DROP CONSTRAINT "CreditNoteItem_creditNoteId_fkey";
ALTER TABLE ONLY public."CreditNoteItem" DROP CONSTRAINT "CreditNoteItem_batchId_fkey";
ALTER TABLE ONLY public."CompanyFeaturePermission" DROP CONSTRAINT "CompanyFeaturePermission_featureId_fkey";
ALTER TABLE ONLY public."CompanyFeaturePermission" DROP CONSTRAINT "CompanyFeaturePermission_companyId_fkey";
ALTER TABLE ONLY public."ChemistVisit" DROP CONSTRAINT "ChemistVisit_mrId_fkey";
ALTER TABLE ONLY public."ChemistVisit" DROP CONSTRAINT "ChemistVisit_chemistId_fkey";
ALTER TABLE ONLY public."Branch" DROP CONSTRAINT "Branch_companyId_fkey";
ALTER TABLE ONLY public."Batch" DROP CONSTRAINT "Batch_productId_fkey";
ALTER TABLE ONLY public."Attendance" DROP CONSTRAINT "Attendance_mrId_fkey";
ALTER TABLE ONLY public."Activity" DROP CONSTRAINT "Activity_mrId_fkey";
DROP INDEX public."Warehouse_code_key";
DROP INDEX public."WarehouseTransfer_transferNo_key";
DROP INDEX public."User_email_key";
DROP INDEX public."TransportChallan_challanNumber_key";
DROP INDEX public."Supplier_name_key";
DROP INDEX public."Stockist_code_key";
DROP INDEX public."SchemeMaster_code_key";
DROP INDEX public."Retailer_code_key";
DROP INDEX public."RetailerOrder_orderNumber_key";
DROP INDEX public."Product_code_key";
DROP INDEX public."ProductCategory_name_key";
DROP INDEX public."PackingType_code_key";
DROP INDEX public."OutwardStock_dispatchNo_key";
DROP INDEX public."Module_name_key";
DROP INDEX public."MR_userId_key";
DROP INDEX public."MR_mrCode_key";
DROP INDEX public."Lead_leadCode_key";
DROP INDEX public."LRTracking_lrNumber_key";
DROP INDEX public."InwardStock_grnNo_key";
DROP INDEX public."Invoice_invoiceNumber_key";
DROP INDEX public."HSNCode_code_key";
DROP INDEX public."Doctor_doctorCode_key";
DROP INDEX public."CreditNote_cnNo_key";
DROP INDEX public."CompanyFeaturePermission_companyId_featureId_key";
DROP INDEX public."Chemist_chemistCode_key";
ALTER TABLE ONLY public._prisma_migrations DROP CONSTRAINT _prisma_migrations_pkey;
ALTER TABLE ONLY public."Warehouse" DROP CONSTRAINT "Warehouse_pkey";
ALTER TABLE ONLY public."WarehouseTransfer" DROP CONSTRAINT "WarehouseTransfer_pkey";
ALTER TABLE ONLY public."WarehouseTransferItem" DROP CONSTRAINT "WarehouseTransferItem_pkey";
ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_pkey";
ALTER TABLE ONLY public."TransportChallan" DROP CONSTRAINT "TransportChallan_pkey";
ALTER TABLE ONLY public."TourPlan" DROP CONSTRAINT "TourPlan_pkey";
ALTER TABLE ONLY public."TourPlanDoctor" DROP CONSTRAINT "TourPlanDoctor_pkey";
ALTER TABLE ONLY public."TourPlanChemist" DROP CONSTRAINT "TourPlanChemist_pkey";
ALTER TABLE ONLY public."TerritoryBeat" DROP CONSTRAINT "TerritoryBeat_pkey";
ALTER TABLE ONLY public."Target" DROP CONSTRAINT "Target_pkey";
ALTER TABLE ONLY public."Supplier" DROP CONSTRAINT "Supplier_pkey";
ALTER TABLE ONLY public."Stockist" DROP CONSTRAINT "Stockist_pkey";
ALTER TABLE ONLY public."StockMovement" DROP CONSTRAINT "StockMovement_pkey";
ALTER TABLE ONLY public."SchemeMaster" DROP CONSTRAINT "SchemeMaster_pkey";
ALTER TABLE ONLY public."RolePermission" DROP CONSTRAINT "RolePermission_pkey";
ALTER TABLE ONLY public."Retailer" DROP CONSTRAINT "Retailer_pkey";
ALTER TABLE ONLY public."RetailerOrder" DROP CONSTRAINT "RetailerOrder_pkey";
ALTER TABLE ONLY public."RetailerOrderItem" DROP CONSTRAINT "RetailerOrderItem_pkey";
ALTER TABLE ONLY public."Product" DROP CONSTRAINT "Product_pkey";
ALTER TABLE ONLY public."ProductCategory" DROP CONSTRAINT "ProductCategory_pkey";
ALTER TABLE ONLY public."PricingMaster" DROP CONSTRAINT "PricingMaster_pkey";
ALTER TABLE ONLY public."PaymentCollection" DROP CONSTRAINT "PaymentCollection_pkey";
ALTER TABLE ONLY public."PackingType" DROP CONSTRAINT "PackingType_pkey";
ALTER TABLE ONLY public."OutwardStock" DROP CONSTRAINT "OutwardStock_pkey";
ALTER TABLE ONLY public."OutwardStockItem" DROP CONSTRAINT "OutwardStockItem_pkey";
ALTER TABLE ONLY public."Notification" DROP CONSTRAINT "Notification_pkey";
ALTER TABLE ONLY public."Module" DROP CONSTRAINT "Module_pkey";
ALTER TABLE ONLY public."Meeting" DROP CONSTRAINT "Meeting_pkey";
ALTER TABLE ONLY public."MeetingStockist" DROP CONSTRAINT "MeetingStockist_pkey";
ALTER TABLE ONLY public."MeetingHospital" DROP CONSTRAINT "MeetingHospital_pkey";
ALTER TABLE ONLY public."MeetingDoctor" DROP CONSTRAINT "MeetingDoctor_pkey";
ALTER TABLE ONLY public."MeetingChemist" DROP CONSTRAINT "MeetingChemist_pkey";
ALTER TABLE ONLY public."MR" DROP CONSTRAINT "MR_pkey";
ALTER TABLE ONLY public."Ledger" DROP CONSTRAINT "Ledger_pkey";
ALTER TABLE ONLY public."LeaveRequest" DROP CONSTRAINT "LeaveRequest_pkey";
ALTER TABLE ONLY public."Lead" DROP CONSTRAINT "Lead_pkey";
ALTER TABLE ONLY public."LRTracking" DROP CONSTRAINT "LRTracking_pkey";
ALTER TABLE ONLY public."InwardStock" DROP CONSTRAINT "InwardStock_pkey";
ALTER TABLE ONLY public."InwardStockItem" DROP CONSTRAINT "InwardStockItem_pkey";
ALTER TABLE ONLY public."Invoice" DROP CONSTRAINT "Invoice_pkey";
ALTER TABLE ONLY public."InvoiceItem" DROP CONSTRAINT "InvoiceItem_pkey";
ALTER TABLE ONLY public."Inventory" DROP CONSTRAINT "Inventory_pkey";
ALTER TABLE ONLY public."Income" DROP CONSTRAINT "Income_pkey";
ALTER TABLE ONLY public."Hospital" DROP CONSTRAINT "Hospital_pkey";
ALTER TABLE ONLY public."HSNCode" DROP CONSTRAINT "HSNCode_pkey";
ALTER TABLE ONLY public."GSTRecord" DROP CONSTRAINT "GSTRecord_pkey";
ALTER TABLE ONLY public."FollowUp" DROP CONSTRAINT "FollowUp_pkey";
ALTER TABLE ONLY public."Feature" DROP CONSTRAINT "Feature_pkey";
ALTER TABLE ONLY public."Expense" DROP CONSTRAINT "Expense_pkey";
ALTER TABLE ONLY public."ExpenseClaim" DROP CONSTRAINT "ExpenseClaim_pkey";
ALTER TABLE ONLY public."Doctor" DROP CONSTRAINT "Doctor_pkey";
ALTER TABLE ONLY public."DoctorVisit" DROP CONSTRAINT "DoctorVisit_pkey";
ALTER TABLE ONLY public."Distributor" DROP CONSTRAINT "Distributor_pkey";
ALTER TABLE ONLY public."Dispatch" DROP CONSTRAINT "Dispatch_pkey";
ALTER TABLE ONLY public."DeliveryTracking" DROP CONSTRAINT "DeliveryTracking_pkey";
ALTER TABLE ONLY public."DailyReport" DROP CONSTRAINT "DailyReport_pkey";
ALTER TABLE ONLY public."CreditNote" DROP CONSTRAINT "CreditNote_pkey";
ALTER TABLE ONLY public."CreditNoteItem" DROP CONSTRAINT "CreditNoteItem_pkey";
ALTER TABLE ONLY public."Company" DROP CONSTRAINT "Company_pkey";
ALTER TABLE ONLY public."CompanyFeaturePermission" DROP CONSTRAINT "CompanyFeaturePermission_pkey";
ALTER TABLE ONLY public."Chemist" DROP CONSTRAINT "Chemist_pkey";
ALTER TABLE ONLY public."ChemistVisit" DROP CONSTRAINT "ChemistVisit_pkey";
ALTER TABLE ONLY public."Branch" DROP CONSTRAINT "Branch_pkey";
ALTER TABLE ONLY public."Batch" DROP CONSTRAINT "Batch_pkey";
ALTER TABLE ONLY public."Attendance" DROP CONSTRAINT "Attendance_pkey";
ALTER TABLE ONLY public."Activity" DROP CONSTRAINT "Activity_pkey";
ALTER TABLE public."WarehouseTransferItem" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."WarehouseTransfer" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Warehouse" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."User" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."TransportChallan" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."TourPlanDoctor" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."TourPlanChemist" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."TourPlan" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."TerritoryBeat" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Target" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Supplier" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Stockist" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."StockMovement" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."SchemeMaster" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."RolePermission" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."RetailerOrderItem" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."RetailerOrder" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Retailer" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."ProductCategory" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Product" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."PricingMaster" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."PaymentCollection" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."PackingType" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."OutwardStockItem" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."OutwardStock" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Notification" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Module" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."MeetingStockist" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."MeetingHospital" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."MeetingDoctor" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."MeetingChemist" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Meeting" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."MR" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Ledger" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."LeaveRequest" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Lead" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."LRTracking" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."InwardStockItem" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."InwardStock" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."InvoiceItem" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Invoice" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Inventory" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Income" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Hospital" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."HSNCode" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."GSTRecord" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."FollowUp" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Feature" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."ExpenseClaim" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Expense" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."DoctorVisit" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Doctor" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Distributor" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Dispatch" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."DeliveryTracking" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."DailyReport" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."CreditNoteItem" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."CreditNote" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."CompanyFeaturePermission" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Company" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."ChemistVisit" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Chemist" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Branch" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Batch" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Attendance" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public."Activity" ALTER COLUMN id DROP DEFAULT;
DROP TABLE public._prisma_migrations;
DROP SEQUENCE public."Warehouse_id_seq";
DROP SEQUENCE public."WarehouseTransfer_id_seq";
DROP SEQUENCE public."WarehouseTransferItem_id_seq";
DROP TABLE public."WarehouseTransferItem";
DROP TABLE public."WarehouseTransfer";
DROP TABLE public."Warehouse";
DROP SEQUENCE public."User_id_seq";
DROP TABLE public."User";
DROP SEQUENCE public."TransportChallan_id_seq";
DROP TABLE public."TransportChallan";
DROP SEQUENCE public."TourPlan_id_seq";
DROP SEQUENCE public."TourPlanDoctor_id_seq";
DROP TABLE public."TourPlanDoctor";
DROP SEQUENCE public."TourPlanChemist_id_seq";
DROP TABLE public."TourPlanChemist";
DROP TABLE public."TourPlan";
DROP SEQUENCE public."TerritoryBeat_id_seq";
DROP TABLE public."TerritoryBeat";
DROP SEQUENCE public."Target_id_seq";
DROP TABLE public."Target";
DROP SEQUENCE public."Supplier_id_seq";
DROP TABLE public."Supplier";
DROP SEQUENCE public."Stockist_id_seq";
DROP TABLE public."Stockist";
DROP SEQUENCE public."StockMovement_id_seq";
DROP TABLE public."StockMovement";
DROP SEQUENCE public."SchemeMaster_id_seq";
DROP TABLE public."SchemeMaster";
DROP SEQUENCE public."RolePermission_id_seq";
DROP TABLE public."RolePermission";
DROP SEQUENCE public."Retailer_id_seq";
DROP SEQUENCE public."RetailerOrder_id_seq";
DROP SEQUENCE public."RetailerOrderItem_id_seq";
DROP TABLE public."RetailerOrderItem";
DROP TABLE public."RetailerOrder";
DROP TABLE public."Retailer";
DROP SEQUENCE public."Product_id_seq";
DROP SEQUENCE public."ProductCategory_id_seq";
DROP TABLE public."ProductCategory";
DROP TABLE public."Product";
DROP SEQUENCE public."PricingMaster_id_seq";
DROP TABLE public."PricingMaster";
DROP SEQUENCE public."PaymentCollection_id_seq";
DROP TABLE public."PaymentCollection";
DROP SEQUENCE public."PackingType_id_seq";
DROP TABLE public."PackingType";
DROP SEQUENCE public."OutwardStock_id_seq";
DROP SEQUENCE public."OutwardStockItem_id_seq";
DROP TABLE public."OutwardStockItem";
DROP TABLE public."OutwardStock";
DROP SEQUENCE public."Notification_id_seq";
DROP TABLE public."Notification";
DROP SEQUENCE public."Module_id_seq";
DROP TABLE public."Module";
DROP SEQUENCE public."Meeting_id_seq";
DROP SEQUENCE public."MeetingStockist_id_seq";
DROP TABLE public."MeetingStockist";
DROP SEQUENCE public."MeetingHospital_id_seq";
DROP TABLE public."MeetingHospital";
DROP SEQUENCE public."MeetingDoctor_id_seq";
DROP TABLE public."MeetingDoctor";
DROP SEQUENCE public."MeetingChemist_id_seq";
DROP TABLE public."MeetingChemist";
DROP TABLE public."Meeting";
DROP SEQUENCE public."MR_id_seq";
DROP TABLE public."MR";
DROP SEQUENCE public."Ledger_id_seq";
DROP TABLE public."Ledger";
DROP SEQUENCE public."LeaveRequest_id_seq";
DROP TABLE public."LeaveRequest";
DROP SEQUENCE public."Lead_id_seq";
DROP TABLE public."Lead";
DROP SEQUENCE public."LRTracking_id_seq";
DROP TABLE public."LRTracking";
DROP SEQUENCE public."InwardStock_id_seq";
DROP SEQUENCE public."InwardStockItem_id_seq";
DROP TABLE public."InwardStockItem";
DROP TABLE public."InwardStock";
DROP SEQUENCE public."Invoice_id_seq";
DROP SEQUENCE public."InvoiceItem_id_seq";
DROP TABLE public."InvoiceItem";
DROP TABLE public."Invoice";
DROP SEQUENCE public."Inventory_id_seq";
DROP TABLE public."Inventory";
DROP SEQUENCE public."Income_id_seq";
DROP TABLE public."Income";
DROP SEQUENCE public."Hospital_id_seq";
DROP TABLE public."Hospital";
DROP SEQUENCE public."HSNCode_id_seq";
DROP TABLE public."HSNCode";
DROP SEQUENCE public."GSTRecord_id_seq";
DROP TABLE public."GSTRecord";
DROP SEQUENCE public."FollowUp_id_seq";
DROP TABLE public."FollowUp";
DROP SEQUENCE public."Feature_id_seq";
DROP TABLE public."Feature";
DROP SEQUENCE public."Expense_id_seq";
DROP SEQUENCE public."ExpenseClaim_id_seq";
DROP TABLE public."ExpenseClaim";
DROP TABLE public."Expense";
DROP SEQUENCE public."Doctor_id_seq";
DROP SEQUENCE public."DoctorVisit_id_seq";
DROP TABLE public."DoctorVisit";
DROP TABLE public."Doctor";
DROP SEQUENCE public."Distributor_id_seq";
DROP TABLE public."Distributor";
DROP SEQUENCE public."Dispatch_id_seq";
DROP TABLE public."Dispatch";
DROP SEQUENCE public."DeliveryTracking_id_seq";
DROP TABLE public."DeliveryTracking";
DROP SEQUENCE public."DailyReport_id_seq";
DROP TABLE public."DailyReport";
DROP SEQUENCE public."CreditNote_id_seq";
DROP SEQUENCE public."CreditNoteItem_id_seq";
DROP TABLE public."CreditNoteItem";
DROP TABLE public."CreditNote";
DROP SEQUENCE public."Company_id_seq";
DROP SEQUENCE public."CompanyFeaturePermission_id_seq";
DROP TABLE public."CompanyFeaturePermission";
DROP TABLE public."Company";
DROP SEQUENCE public."Chemist_id_seq";
DROP SEQUENCE public."ChemistVisit_id_seq";
DROP TABLE public."ChemistVisit";
DROP TABLE public."Chemist";
DROP SEQUENCE public."Branch_id_seq";
DROP TABLE public."Branch";
DROP SEQUENCE public."Batch_id_seq";
DROP TABLE public."Batch";
DROP SEQUENCE public."Attendance_id_seq";
DROP TABLE public."Attendance";
DROP SEQUENCE public."Activity_id_seq";
DROP TABLE public."Activity";
DROP TYPE public."Role";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'WAREHOUSE_MANAGER',
    'ACCOUNTANT',
    'DISTRIBUTOR',
    'RETAILER',
    'MEDICAL_REPRESENTATIVE',
    'SUPER_ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Activity" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "activityType" text NOT NULL,
    title text NOT NULL,
    description text,
    "activityDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Activity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Activity_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Activity_id_seq" OWNED BY public."Activity".id;


--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Attendance" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "attendanceDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "checkInTime" timestamp(3) without time zone,
    "checkOutTime" timestamp(3) without time zone,
    "checkInLatitude" double precision,
    "checkInLongitude" double precision,
    "checkOutLatitude" double precision,
    "checkOutLongitude" double precision,
    status text DEFAULT 'PRESENT'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Attendance_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Attendance_id_seq" OWNED BY public."Attendance".id;


--
-- Name: Batch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Batch" (
    id integer NOT NULL,
    "batchNumber" text NOT NULL,
    "productId" integer NOT NULL,
    "manufacturingDate" timestamp(3) without time zone NOT NULL,
    "expiryDate" timestamp(3) without time zone NOT NULL,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Batch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Batch_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Batch_id_seq" OWNED BY public."Batch".id;


--
-- Name: Branch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Branch" (
    id integer NOT NULL,
    name text NOT NULL,
    code text,
    address text,
    city text,
    "companyId" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Branch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Branch_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Branch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Branch_id_seq" OWNED BY public."Branch".id;


--
-- Name: Chemist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Chemist" (
    id integer NOT NULL,
    "chemistCode" text NOT NULL,
    name text NOT NULL,
    mobile text,
    email text,
    address text,
    territory text,
    "gstNumber" text,
    "drugLicenseNumber" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ChemistVisit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ChemistVisit" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "chemistId" integer NOT NULL,
    "visitDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks text,
    "productsDiscussed" text,
    "orderValue" double precision,
    latitude double precision,
    longitude double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ChemistVisit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ChemistVisit_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ChemistVisit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ChemistVisit_id_seq" OWNED BY public."ChemistVisit".id;


--
-- Name: Chemist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Chemist_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Chemist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Chemist_id_seq" OWNED BY public."Chemist".id;


--
-- Name: Company; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Company" (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CompanyFeaturePermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CompanyFeaturePermission" (
    id integer NOT NULL,
    "companyId" integer NOT NULL,
    "featureId" integer NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CompanyFeaturePermission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CompanyFeaturePermission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CompanyFeaturePermission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CompanyFeaturePermission_id_seq" OWNED BY public."CompanyFeaturePermission".id;


--
-- Name: Company_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Company_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Company_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Company_id_seq" OWNED BY public."Company".id;


--
-- Name: CreditNote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CreditNote" (
    id integer NOT NULL,
    "cnNo" text NOT NULL,
    "cnDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "cnType" text NOT NULL,
    reason text NOT NULL,
    remarks text,
    "retailerId" integer,
    "distributorId" integer,
    "mrId" integer,
    "againstInvoiceId" integer,
    "taxableAmount" double precision DEFAULT 0.0 NOT NULL,
    "gstAmount" double precision DEFAULT 0.0 NOT NULL,
    "totalAmount" double precision DEFAULT 0.0 NOT NULL,
    "amountSettled" double precision DEFAULT 0.0 NOT NULL,
    "approvedByUserId" integer,
    "approvedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CreditNoteItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CreditNoteItem" (
    id integer NOT NULL,
    "creditNoteId" integer NOT NULL,
    "productId" integer NOT NULL,
    "batchId" integer NOT NULL,
    quantity integer NOT NULL,
    rate double precision NOT NULL,
    "gstPercent" double precision NOT NULL,
    "totalAmount" double precision NOT NULL,
    disposition text DEFAULT 'SALABLE'::text NOT NULL
);


--
-- Name: CreditNoteItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CreditNoteItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CreditNoteItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CreditNoteItem_id_seq" OWNED BY public."CreditNoteItem".id;


--
-- Name: CreditNote_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CreditNote_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CreditNote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CreditNote_id_seq" OWNED BY public."CreditNote".id;


--
-- Name: DailyReport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DailyReport" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "reportDate" timestamp(3) without time zone NOT NULL,
    "doctorVisits" integer DEFAULT 0 NOT NULL,
    "chemistVisits" integer DEFAULT 0 NOT NULL,
    "samplesDistributed" integer DEFAULT 0 NOT NULL,
    "ordersCollected" numeric(65,30) DEFAULT 0 NOT NULL,
    remarks text,
    status text DEFAULT 'SUBMITTED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DailyReport_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DailyReport_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DailyReport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DailyReport_id_seq" OWNED BY public."DailyReport".id;


--
-- Name: DeliveryTracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DeliveryTracking" (
    id integer NOT NULL,
    "lrTrackingId" integer NOT NULL,
    "receiverName" text NOT NULL,
    "receiverMobile" text,
    "deliveryDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'DELIVERED'::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DeliveryTracking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DeliveryTracking_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DeliveryTracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DeliveryTracking_id_seq" OWNED BY public."DeliveryTracking".id;


--
-- Name: Dispatch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Dispatch" (
    id integer NOT NULL,
    "batchId" integer,
    "warehouseId" integer,
    "customerName" text,
    quantity integer,
    "dispatchDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdBy" text,
    "createdDate" text,
    "dispatchNo" text,
    "dispatchType" text,
    "driverMobile" text,
    "driverName" text,
    "lrNumber" text,
    "orderId" text,
    products jsonb,
    "sourceWarehouse" text,
    "totalItems" integer,
    "totalQuantity" integer,
    transporter text,
    "vehicleNumber" text,
    "expectedDeliveryDate" text
);


--
-- Name: Dispatch_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Dispatch_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Dispatch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Dispatch_id_seq" OWNED BY public."Dispatch".id;


--
-- Name: Distributor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Distributor" (
    id integer NOT NULL,
    name text NOT NULL,
    mobile text NOT NULL
);


--
-- Name: Distributor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Distributor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Distributor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Distributor_id_seq" OWNED BY public."Distributor".id;


--
-- Name: Doctor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Doctor" (
    id integer NOT NULL,
    "doctorCode" text NOT NULL,
    name text NOT NULL,
    specialization text,
    hospital text,
    mobile text,
    email text,
    address text,
    territory text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DoctorVisit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DoctorVisit" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "doctorId" integer NOT NULL,
    "visitDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks text,
    "productsDiscussed" text,
    "samplesGiven" integer,
    latitude double precision,
    longitude double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DoctorVisit_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DoctorVisit_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DoctorVisit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DoctorVisit_id_seq" OWNED BY public."DoctorVisit".id;


--
-- Name: Doctor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Doctor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Doctor_id_seq" OWNED BY public."Doctor".id;


--
-- Name: Expense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Expense" (
    id integer NOT NULL,
    "expenseType" text NOT NULL,
    amount double precision NOT NULL,
    remarks text,
    "expenseDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ExpenseClaim; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExpenseClaim" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "expenseType" text NOT NULL,
    amount numeric(65,30) NOT NULL,
    "expenseDate" timestamp(3) without time zone NOT NULL,
    description text,
    "receiptUrl" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "submittedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ExpenseClaim_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ExpenseClaim_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ExpenseClaim_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ExpenseClaim_id_seq" OWNED BY public."ExpenseClaim".id;


--
-- Name: Expense_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Expense_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Expense_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Expense_id_seq" OWNED BY public."Expense".id;


--
-- Name: Feature; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Feature" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "moduleId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Feature_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Feature_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Feature_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Feature_id_seq" OWNED BY public."Feature".id;


--
-- Name: FollowUp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FollowUp" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "doctorId" integer,
    "chemistId" integer,
    "meetingId" integer,
    title text NOT NULL,
    remarks text,
    "followUpDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: FollowUp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."FollowUp_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: FollowUp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."FollowUp_id_seq" OWNED BY public."FollowUp".id;


--
-- Name: GSTRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GSTRecord" (
    id integer NOT NULL,
    "hsnCode" text NOT NULL,
    description text NOT NULL,
    "gstPercent" double precision NOT NULL,
    "effectiveDate" timestamp(3) without time zone,
    "createdBy" text,
    "lastUpdatedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    remarks text,
    status text DEFAULT 'Active'::text NOT NULL
);


--
-- Name: GSTRecord_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GSTRecord_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: GSTRecord_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GSTRecord_id_seq" OWNED BY public."GSTRecord".id;


--
-- Name: HSNCode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HSNCode" (
    id integer NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: HSNCode_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."HSNCode_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: HSNCode_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."HSNCode_id_seq" OWNED BY public."HSNCode".id;


--
-- Name: Hospital; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Hospital" (
    id integer NOT NULL,
    name text NOT NULL,
    mobile text,
    address text
);


--
-- Name: Hospital_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Hospital_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Hospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Hospital_id_seq" OWNED BY public."Hospital".id;


--
-- Name: Income; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Income" (
    id integer NOT NULL,
    "incomeType" text NOT NULL,
    amount double precision NOT NULL,
    remarks text,
    "incomeDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Income_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Income_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Income_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Income_id_seq" OWNED BY public."Income".id;


--
-- Name: Inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Inventory" (
    id integer NOT NULL,
    "batchId" integer NOT NULL,
    quantity integer NOT NULL,
    "warehouseId" integer NOT NULL
);


--
-- Name: Inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Inventory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Inventory_id_seq" OWNED BY public."Inventory".id;


--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Invoice" (
    id integer NOT NULL,
    "retailerId" integer NOT NULL,
    "invoiceNumber" text NOT NULL,
    "invoiceDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "subTotal" double precision NOT NULL,
    "gstAmount" double precision NOT NULL,
    "totalAmount" double precision NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: InvoiceItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InvoiceItem" (
    id integer NOT NULL,
    "invoiceId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    rate double precision NOT NULL,
    gst double precision NOT NULL,
    amount double precision NOT NULL
);


--
-- Name: InvoiceItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."InvoiceItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: InvoiceItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."InvoiceItem_id_seq" OWNED BY public."InvoiceItem".id;


--
-- Name: Invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Invoice_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Invoice_id_seq" OWNED BY public."Invoice".id;


--
-- Name: InwardStock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InwardStock" (
    id integer NOT NULL,
    "grnNo" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "supplierId" integer NOT NULL,
    "warehouseId" integer NOT NULL,
    "invoiceNumber" text,
    "invoiceDate" timestamp(3) without time zone,
    "itemsCount" integer DEFAULT 0 NOT NULL,
    "totalQuantity" integer DEFAULT 0 NOT NULL,
    "totalValue" double precision DEFAULT 0.0 NOT NULL,
    status text DEFAULT 'Completed'::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: InwardStockItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InwardStockItem" (
    id integer NOT NULL,
    "inwardStockId" integer NOT NULL,
    "productId" integer NOT NULL,
    "batchNo" text NOT NULL,
    "mfgDate" timestamp(3) without time zone,
    "expiryDate" timestamp(3) without time zone,
    quantity integer NOT NULL,
    ptr double precision DEFAULT 0.0 NOT NULL,
    mrp double precision DEFAULT 0.0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: InwardStockItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."InwardStockItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: InwardStockItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."InwardStockItem_id_seq" OWNED BY public."InwardStockItem".id;


--
-- Name: InwardStock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."InwardStock_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: InwardStock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."InwardStock_id_seq" OWNED BY public."InwardStock".id;


--
-- Name: LRTracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LRTracking" (
    id integer NOT NULL,
    "transportChallanId" integer NOT NULL,
    "lrNumber" text NOT NULL,
    source text NOT NULL,
    destination text NOT NULL,
    status text DEFAULT 'IN_TRANSIT'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LRTracking_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."LRTracking_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: LRTracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."LRTracking_id_seq" OWNED BY public."LRTracking".id;


--
-- Name: Lead; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Lead" (
    id integer NOT NULL,
    "leadCode" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    mobile text,
    email text,
    address text,
    territory text,
    source text,
    status text DEFAULT 'NEW'::text NOT NULL,
    "assignedMrId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Lead_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Lead_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Lead_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Lead_id_seq" OWNED BY public."Lead".id;


--
-- Name: LeaveRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeaveRequest" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "leaveType" text NOT NULL,
    "fromDate" timestamp(3) without time zone NOT NULL,
    "toDate" timestamp(3) without time zone NOT NULL,
    reason text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "appliedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LeaveRequest_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."LeaveRequest_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: LeaveRequest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."LeaveRequest_id_seq" OWNED BY public."LeaveRequest".id;


--
-- Name: Ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Ledger" (
    id integer NOT NULL,
    "retailerId" integer NOT NULL,
    "transactionType" text NOT NULL,
    "referenceNumber" text NOT NULL,
    debit double precision DEFAULT 0 NOT NULL,
    credit double precision DEFAULT 0 NOT NULL,
    balance double precision NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Ledger_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Ledger_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Ledger_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Ledger_id_seq" OWNED BY public."Ledger".id;


--
-- Name: MR; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MR" (
    id integer NOT NULL,
    "mrCode" text NOT NULL,
    name text NOT NULL,
    mobile text NOT NULL,
    email text,
    territory text,
    "joiningDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" integer
);


--
-- Name: MR_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MR_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MR_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MR_id_seq" OWNED BY public."MR".id;


--
-- Name: Meeting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Meeting" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "doctorId" integer,
    "chemistId" integer,
    title text NOT NULL,
    description text,
    "meetingDate" timestamp(3) without time zone NOT NULL,
    location text,
    status text DEFAULT 'SCHEDULED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MeetingChemist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MeetingChemist" (
    id integer NOT NULL,
    "meetingId" integer NOT NULL,
    "chemistId" integer NOT NULL
);


--
-- Name: MeetingChemist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MeetingChemist_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MeetingChemist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MeetingChemist_id_seq" OWNED BY public."MeetingChemist".id;


--
-- Name: MeetingDoctor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MeetingDoctor" (
    id integer NOT NULL,
    "meetingId" integer NOT NULL,
    "doctorId" integer NOT NULL
);


--
-- Name: MeetingDoctor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MeetingDoctor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MeetingDoctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MeetingDoctor_id_seq" OWNED BY public."MeetingDoctor".id;


--
-- Name: MeetingHospital; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MeetingHospital" (
    id integer NOT NULL,
    "meetingId" integer NOT NULL,
    "hospitalId" integer NOT NULL
);


--
-- Name: MeetingHospital_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MeetingHospital_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MeetingHospital_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MeetingHospital_id_seq" OWNED BY public."MeetingHospital".id;


--
-- Name: MeetingStockist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MeetingStockist" (
    id integer NOT NULL,
    "meetingId" integer NOT NULL,
    "stockistId" integer NOT NULL
);


--
-- Name: MeetingStockist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."MeetingStockist_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: MeetingStockist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."MeetingStockist_id_seq" OWNED BY public."MeetingStockist".id;


--
-- Name: Meeting_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Meeting_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Meeting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Meeting_id_seq" OWNED BY public."Meeting".id;


--
-- Name: Module; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Module" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Module_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Module_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Module_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Module_id_seq" OWNED BY public."Module".id;


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Notification_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Notification_id_seq" OWNED BY public."Notification".id;


--
-- Name: OutwardStock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OutwardStock" (
    id integer NOT NULL,
    "dispatchNo" text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    client text NOT NULL,
    "warehouseId" integer NOT NULL,
    "referenceNumber" text,
    "itemsCount" integer DEFAULT 0 NOT NULL,
    "totalQuantity" integer DEFAULT 0 NOT NULL,
    "totalValue" double precision DEFAULT 0.0 NOT NULL,
    status text DEFAULT 'Dispatched'::text NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OutwardStockItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OutwardStockItem" (
    id integer NOT NULL,
    "outwardStockId" integer NOT NULL,
    "productId" integer NOT NULL,
    "batchId" integer NOT NULL,
    quantity integer NOT NULL,
    rate double precision DEFAULT 0.0 NOT NULL
);


--
-- Name: OutwardStockItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OutwardStockItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OutwardStockItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OutwardStockItem_id_seq" OWNED BY public."OutwardStockItem".id;


--
-- Name: OutwardStock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."OutwardStock_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: OutwardStock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."OutwardStock_id_seq" OWNED BY public."OutwardStock".id;


--
-- Name: PackingType; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PackingType" (
    id integer NOT NULL,
    code text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    uom text DEFAULT ''::text NOT NULL
);


--
-- Name: PackingType_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PackingType_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PackingType_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PackingType_id_seq" OWNED BY public."PackingType".id;


--
-- Name: PaymentCollection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PaymentCollection" (
    id integer NOT NULL,
    "invoiceId" integer NOT NULL,
    amount double precision NOT NULL,
    "paymentMode" text NOT NULL,
    "transactionRef" text,
    "paymentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PaymentCollection_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PaymentCollection_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PaymentCollection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PaymentCollection_id_seq" OWNED BY public."PaymentCollection".id;


--
-- Name: PricingMaster; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PricingMaster" (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    mrp double precision NOT NULL,
    ptr double precision NOT NULL,
    pts double precision NOT NULL,
    margin double precision NOT NULL,
    "effectiveDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "batchId" integer,
    status text DEFAULT 'Active'::text NOT NULL
);


--
-- Name: PricingMaster_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PricingMaster_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PricingMaster_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PricingMaster_id_seq" OWNED BY public."PricingMaster".id;


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "categoryId" integer NOT NULL,
    "hsnCode" text,
    gst double precision,
    mrp double precision NOT NULL,
    ptr double precision,
    pts double precision,
    ptd double precision,
    "companyId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "minStock" integer NOT NULL,
    "batchTracking" boolean DEFAULT false NOT NULL,
    "brandName" text,
    composition text,
    "expiryTracking" boolean DEFAULT false NOT NULL,
    "genericName" text,
    manufacturer text,
    "packingType" text,
    "packsInBox" text,
    "purchasePrice" double precision,
    "reorderLevel" integer,
    scheme text,
    "sellingPrice" double precision,
    status text DEFAULT 'Active'::text NOT NULL,
    "totalUnits" text,
    type text,
    "unitsPerPack" text
);


--
-- Name: ProductCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductCategory" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProductCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ProductCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ProductCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ProductCategory_id_seq" OWNED BY public."ProductCategory".id;


--
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- Name: Retailer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Retailer" (
    id integer NOT NULL,
    "stockistId" integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    mobile text NOT NULL,
    email text,
    address text,
    "gstNumber" text,
    "drugLicenseNumber" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RetailerOrder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RetailerOrder" (
    id integer NOT NULL,
    "retailerId" integer,
    "orderNumber" text NOT NULL,
    "orderDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "totalAmount" double precision NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "mrId" integer,
    "chemistId" integer,
    "hospitalId" integer,
    "stockistId" integer
);


--
-- Name: RetailerOrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RetailerOrderItem" (
    id integer NOT NULL,
    "retailerOrderId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL,
    rate double precision NOT NULL,
    amount double precision NOT NULL
);


--
-- Name: RetailerOrderItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."RetailerOrderItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: RetailerOrderItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."RetailerOrderItem_id_seq" OWNED BY public."RetailerOrderItem".id;


--
-- Name: RetailerOrder_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."RetailerOrder_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: RetailerOrder_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."RetailerOrder_id_seq" OWNED BY public."RetailerOrder".id;


--
-- Name: Retailer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Retailer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Retailer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Retailer_id_seq" OWNED BY public."Retailer".id;


--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RolePermission" (
    id integer NOT NULL,
    "companyId" integer NOT NULL,
    role public."Role" NOT NULL,
    "featureId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: RolePermission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."RolePermission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: RolePermission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."RolePermission_id_seq" OWNED BY public."RolePermission".id;


--
-- Name: SchemeMaster; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SchemeMaster" (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "productId" integer,
    "buyQty" integer NOT NULL,
    "freeQty" integer NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    status text DEFAULT 'Active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "batchId" integer,
    "applicableSelection" text DEFAULT ''::text NOT NULL,
    "applicableTo" text DEFAULT 'All Products'::text NOT NULL,
    "benefitType" text DEFAULT 'Free Quantity'::text NOT NULL,
    "benefitValue" text,
    remarks text,
    type text DEFAULT 'Quantity Discount'::text NOT NULL
);


--
-- Name: SchemeMaster_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."SchemeMaster_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: SchemeMaster_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."SchemeMaster_id_seq" OWNED BY public."SchemeMaster".id;


--
-- Name: StockMovement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StockMovement" (
    id integer NOT NULL,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inventoryId" integer NOT NULL,
    "movementType" text NOT NULL,
    remarks text
);


--
-- Name: StockMovement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."StockMovement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: StockMovement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."StockMovement_id_seq" OWNED BY public."StockMovement".id;


--
-- Name: Stockist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Stockist" (
    id integer NOT NULL,
    name text NOT NULL,
    code text,
    mobile text NOT NULL,
    email text,
    address text,
    "gstNumber" text,
    "drugLicenseNumber" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Stockist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Stockist_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Stockist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Stockist_id_seq" OWNED BY public."Stockist".id;


--
-- Name: Supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Supplier" (
    id integer NOT NULL,
    name text NOT NULL,
    contact text,
    email text,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Supplier_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Supplier_id_seq" OWNED BY public."Supplier".id;


--
-- Name: Target; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Target" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    "doctorVisitTarget" integer NOT NULL,
    "chemistVisitTarget" integer NOT NULL,
    "orderTarget" numeric(65,30) DEFAULT 0 NOT NULL,
    "achievedDoctorVisits" integer DEFAULT 0 NOT NULL,
    "achievedChemistVisits" integer DEFAULT 0 NOT NULL,
    "achievedOrderValue" numeric(65,30) DEFAULT 0 NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Target_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Target_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Target_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Target_id_seq" OWNED BY public."Target".id;


--
-- Name: TerritoryBeat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TerritoryBeat" (
    id integer NOT NULL,
    area text NOT NULL,
    district text NOT NULL,
    state text NOT NULL,
    "totalDoctors" integer NOT NULL,
    "totalChemists" integer NOT NULL
);


--
-- Name: TerritoryBeat_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TerritoryBeat_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TerritoryBeat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TerritoryBeat_id_seq" OWNED BY public."TerritoryBeat".id;


--
-- Name: TourPlan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TourPlan" (
    id integer NOT NULL,
    "mrId" integer NOT NULL,
    "tourDate" timestamp(3) without time zone NOT NULL,
    territory text NOT NULL,
    objective text,
    status text DEFAULT 'PLANNED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TourPlanChemist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TourPlanChemist" (
    id integer NOT NULL,
    "tourPlanId" integer NOT NULL,
    "chemistId" integer NOT NULL
);


--
-- Name: TourPlanChemist_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TourPlanChemist_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TourPlanChemist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TourPlanChemist_id_seq" OWNED BY public."TourPlanChemist".id;


--
-- Name: TourPlanDoctor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TourPlanDoctor" (
    id integer NOT NULL,
    "tourPlanId" integer NOT NULL,
    "doctorId" integer NOT NULL
);


--
-- Name: TourPlanDoctor_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TourPlanDoctor_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TourPlanDoctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TourPlanDoctor_id_seq" OWNED BY public."TourPlanDoctor".id;


--
-- Name: TourPlan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TourPlan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TourPlan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TourPlan_id_seq" OWNED BY public."TourPlan".id;


--
-- Name: TransportChallan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TransportChallan" (
    id integer NOT NULL,
    "dispatchId" integer,
    "transporterName" text,
    "vehicleNumber" text,
    "driverName" text,
    "driverMobile" text,
    "challanNumber" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualDeliveryDate" text,
    "challanDate" text,
    "challanNo" text,
    "createdBy" text,
    "createdDate" text,
    customer text,
    "dispatchDate" text,
    "dispatchNo" text,
    "orderNo" text,
    "podDesignation" text,
    "podFileName" text,
    "podFileType" text,
    "podFileUrl" text,
    "podReceivedBy" text,
    "podRemarks" text,
    "podStatus" text,
    "podUploadedBy" text,
    "podUploadedDate" text,
    products jsonb,
    "sourceWarehouse" text,
    status text,
    "totalItems" integer,
    "totalQty" integer
);


--
-- Name: TransportChallan_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TransportChallan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: TransportChallan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TransportChallan_id_seq" OWNED BY public."TransportChallan".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "branchId" integer,
    "companyId" integer,
    "currentDeviceId" text,
    mobile text,
    "profileImage" text,
    "linkedDistributorCode" text,
    "linkedRetailerCode" text
);


--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Warehouse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Warehouse" (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    address text,
    "companyId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    branch text DEFAULT 'Default Branch'::text NOT NULL,
    city text,
    "contactPerson" text,
    country text,
    "createdBy" text DEFAULT 'System'::text NOT NULL,
    email text,
    "gstNumber" text,
    "licenseNumber" text,
    phone text,
    "pinCode" text,
    remarks text,
    state text,
    status text DEFAULT 'Active'::text NOT NULL,
    type text DEFAULT 'Main Warehouse'::text NOT NULL
);


--
-- Name: WarehouseTransfer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WarehouseTransfer" (
    id integer NOT NULL,
    "fromWarehouseId" integer NOT NULL,
    "toWarehouseId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    remarks text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "itemsCount" integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'Completed'::text NOT NULL,
    "totalQuantity" integer DEFAULT 0 NOT NULL,
    "transferNo" text NOT NULL
);


--
-- Name: WarehouseTransferItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."WarehouseTransferItem" (
    id integer NOT NULL,
    "warehouseTransferId" integer NOT NULL,
    "productId" integer NOT NULL,
    "batchId" integer NOT NULL,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: WarehouseTransferItem_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."WarehouseTransferItem_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: WarehouseTransferItem_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."WarehouseTransferItem_id_seq" OWNED BY public."WarehouseTransferItem".id;


--
-- Name: WarehouseTransfer_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."WarehouseTransfer_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: WarehouseTransfer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."WarehouseTransfer_id_seq" OWNED BY public."WarehouseTransfer".id;


--
-- Name: Warehouse_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Warehouse_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Warehouse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Warehouse_id_seq" OWNED BY public."Warehouse".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Activity id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity" ALTER COLUMN id SET DEFAULT nextval('public."Activity_id_seq"'::regclass);


--
-- Name: Attendance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance" ALTER COLUMN id SET DEFAULT nextval('public."Attendance_id_seq"'::regclass);


--
-- Name: Batch id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Batch" ALTER COLUMN id SET DEFAULT nextval('public."Batch_id_seq"'::regclass);


--
-- Name: Branch id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Branch" ALTER COLUMN id SET DEFAULT nextval('public."Branch_id_seq"'::regclass);


--
-- Name: Chemist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chemist" ALTER COLUMN id SET DEFAULT nextval('public."Chemist_id_seq"'::regclass);


--
-- Name: ChemistVisit id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChemistVisit" ALTER COLUMN id SET DEFAULT nextval('public."ChemistVisit_id_seq"'::regclass);


--
-- Name: Company id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Company" ALTER COLUMN id SET DEFAULT nextval('public."Company_id_seq"'::regclass);


--
-- Name: CompanyFeaturePermission id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CompanyFeaturePermission" ALTER COLUMN id SET DEFAULT nextval('public."CompanyFeaturePermission_id_seq"'::regclass);


--
-- Name: CreditNote id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNote" ALTER COLUMN id SET DEFAULT nextval('public."CreditNote_id_seq"'::regclass);


--
-- Name: CreditNoteItem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNoteItem" ALTER COLUMN id SET DEFAULT nextval('public."CreditNoteItem_id_seq"'::regclass);


--
-- Name: DailyReport id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DailyReport" ALTER COLUMN id SET DEFAULT nextval('public."DailyReport_id_seq"'::regclass);


--
-- Name: DeliveryTracking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeliveryTracking" ALTER COLUMN id SET DEFAULT nextval('public."DeliveryTracking_id_seq"'::regclass);


--
-- Name: Dispatch id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Dispatch" ALTER COLUMN id SET DEFAULT nextval('public."Dispatch_id_seq"'::regclass);


--
-- Name: Distributor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Distributor" ALTER COLUMN id SET DEFAULT nextval('public."Distributor_id_seq"'::regclass);


--
-- Name: Doctor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Doctor" ALTER COLUMN id SET DEFAULT nextval('public."Doctor_id_seq"'::regclass);


--
-- Name: DoctorVisit id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorVisit" ALTER COLUMN id SET DEFAULT nextval('public."DoctorVisit_id_seq"'::regclass);


--
-- Name: Expense id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense" ALTER COLUMN id SET DEFAULT nextval('public."Expense_id_seq"'::regclass);


--
-- Name: ExpenseClaim id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExpenseClaim" ALTER COLUMN id SET DEFAULT nextval('public."ExpenseClaim_id_seq"'::regclass);


--
-- Name: Feature id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Feature" ALTER COLUMN id SET DEFAULT nextval('public."Feature_id_seq"'::regclass);


--
-- Name: FollowUp id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FollowUp" ALTER COLUMN id SET DEFAULT nextval('public."FollowUp_id_seq"'::regclass);


--
-- Name: GSTRecord id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GSTRecord" ALTER COLUMN id SET DEFAULT nextval('public."GSTRecord_id_seq"'::regclass);


--
-- Name: HSNCode id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HSNCode" ALTER COLUMN id SET DEFAULT nextval('public."HSNCode_id_seq"'::regclass);


--
-- Name: Hospital id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Hospital" ALTER COLUMN id SET DEFAULT nextval('public."Hospital_id_seq"'::regclass);


--
-- Name: Income id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Income" ALTER COLUMN id SET DEFAULT nextval('public."Income_id_seq"'::regclass);


--
-- Name: Inventory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Inventory" ALTER COLUMN id SET DEFAULT nextval('public."Inventory_id_seq"'::regclass);


--
-- Name: Invoice id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice" ALTER COLUMN id SET DEFAULT nextval('public."Invoice_id_seq"'::regclass);


--
-- Name: InvoiceItem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InvoiceItem" ALTER COLUMN id SET DEFAULT nextval('public."InvoiceItem_id_seq"'::regclass);


--
-- Name: InwardStock id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InwardStock" ALTER COLUMN id SET DEFAULT nextval('public."InwardStock_id_seq"'::regclass);


--
-- Name: InwardStockItem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InwardStockItem" ALTER COLUMN id SET DEFAULT nextval('public."InwardStockItem_id_seq"'::regclass);


--
-- Name: LRTracking id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LRTracking" ALTER COLUMN id SET DEFAULT nextval('public."LRTracking_id_seq"'::regclass);


--
-- Name: Lead id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lead" ALTER COLUMN id SET DEFAULT nextval('public."Lead_id_seq"'::regclass);


--
-- Name: LeaveRequest id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequest" ALTER COLUMN id SET DEFAULT nextval('public."LeaveRequest_id_seq"'::regclass);


--
-- Name: Ledger id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ledger" ALTER COLUMN id SET DEFAULT nextval('public."Ledger_id_seq"'::regclass);


--
-- Name: MR id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MR" ALTER COLUMN id SET DEFAULT nextval('public."MR_id_seq"'::regclass);


--
-- Name: Meeting id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Meeting" ALTER COLUMN id SET DEFAULT nextval('public."Meeting_id_seq"'::regclass);


--
-- Name: MeetingChemist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingChemist" ALTER COLUMN id SET DEFAULT nextval('public."MeetingChemist_id_seq"'::regclass);


--
-- Name: MeetingDoctor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingDoctor" ALTER COLUMN id SET DEFAULT nextval('public."MeetingDoctor_id_seq"'::regclass);


--
-- Name: MeetingHospital id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingHospital" ALTER COLUMN id SET DEFAULT nextval('public."MeetingHospital_id_seq"'::regclass);


--
-- Name: MeetingStockist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingStockist" ALTER COLUMN id SET DEFAULT nextval('public."MeetingStockist_id_seq"'::regclass);


--
-- Name: Module id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Module" ALTER COLUMN id SET DEFAULT nextval('public."Module_id_seq"'::regclass);


--
-- Name: Notification id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification" ALTER COLUMN id SET DEFAULT nextval('public."Notification_id_seq"'::regclass);


--
-- Name: OutwardStock id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutwardStock" ALTER COLUMN id SET DEFAULT nextval('public."OutwardStock_id_seq"'::regclass);


--
-- Name: OutwardStockItem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutwardStockItem" ALTER COLUMN id SET DEFAULT nextval('public."OutwardStockItem_id_seq"'::regclass);


--
-- Name: PackingType id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PackingType" ALTER COLUMN id SET DEFAULT nextval('public."PackingType_id_seq"'::regclass);


--
-- Name: PaymentCollection id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentCollection" ALTER COLUMN id SET DEFAULT nextval('public."PaymentCollection_id_seq"'::regclass);


--
-- Name: PricingMaster id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PricingMaster" ALTER COLUMN id SET DEFAULT nextval('public."PricingMaster_id_seq"'::regclass);


--
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- Name: ProductCategory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductCategory" ALTER COLUMN id SET DEFAULT nextval('public."ProductCategory_id_seq"'::regclass);


--
-- Name: Retailer id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Retailer" ALTER COLUMN id SET DEFAULT nextval('public."Retailer_id_seq"'::regclass);


--
-- Name: RetailerOrder id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrder" ALTER COLUMN id SET DEFAULT nextval('public."RetailerOrder_id_seq"'::regclass);


--
-- Name: RetailerOrderItem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrderItem" ALTER COLUMN id SET DEFAULT nextval('public."RetailerOrderItem_id_seq"'::regclass);


--
-- Name: RolePermission id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission" ALTER COLUMN id SET DEFAULT nextval('public."RolePermission_id_seq"'::regclass);


--
-- Name: SchemeMaster id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchemeMaster" ALTER COLUMN id SET DEFAULT nextval('public."SchemeMaster_id_seq"'::regclass);


--
-- Name: StockMovement id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StockMovement" ALTER COLUMN id SET DEFAULT nextval('public."StockMovement_id_seq"'::regclass);


--
-- Name: Stockist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Stockist" ALTER COLUMN id SET DEFAULT nextval('public."Stockist_id_seq"'::regclass);


--
-- Name: Supplier id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Supplier" ALTER COLUMN id SET DEFAULT nextval('public."Supplier_id_seq"'::regclass);


--
-- Name: Target id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Target" ALTER COLUMN id SET DEFAULT nextval('public."Target_id_seq"'::regclass);


--
-- Name: TerritoryBeat id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TerritoryBeat" ALTER COLUMN id SET DEFAULT nextval('public."TerritoryBeat_id_seq"'::regclass);


--
-- Name: TourPlan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlan" ALTER COLUMN id SET DEFAULT nextval('public."TourPlan_id_seq"'::regclass);


--
-- Name: TourPlanChemist id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlanChemist" ALTER COLUMN id SET DEFAULT nextval('public."TourPlanChemist_id_seq"'::regclass);


--
-- Name: TourPlanDoctor id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlanDoctor" ALTER COLUMN id SET DEFAULT nextval('public."TourPlanDoctor_id_seq"'::regclass);


--
-- Name: TransportChallan id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransportChallan" ALTER COLUMN id SET DEFAULT nextval('public."TransportChallan_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Name: Warehouse id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Warehouse" ALTER COLUMN id SET DEFAULT nextval('public."Warehouse_id_seq"'::regclass);


--
-- Name: WarehouseTransfer id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WarehouseTransfer" ALTER COLUMN id SET DEFAULT nextval('public."WarehouseTransfer_id_seq"'::regclass);


--
-- Name: WarehouseTransferItem id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WarehouseTransferItem" ALTER COLUMN id SET DEFAULT nextval('public."WarehouseTransferItem_id_seq"'::regclass);


--
-- Data for Name: Activity; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Activity" (id, "mrId", "activityType", title, description, "activityDate", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Attendance" (id, "mrId", "attendanceDate", "checkInTime", "checkOutTime", "checkInLatitude", "checkInLongitude", "checkOutLatitude", "checkOutLongitude", status, "createdAt") FROM stdin;
3	1	2026-07-15 06:04:54.937	2026-07-15 06:04:54.953	2026-07-15 06:05:05.256	18.44675852827867	79.13330316003842	18.44675852827867	79.13330316003842	PRESENT	2026-07-15 06:04:54.958
4	1	2026-07-15 06:06:04.455	2026-07-15 06:06:04.459	2026-07-15 06:06:04.459	18.44706106025037	79.13333109448098	18.44706106025037	79.13333109448098	PRESENT	2026-07-15 06:06:04.461
5	1	2026-07-16 04:38:53.729	2026-07-16 04:38:53.739	2026-07-16 04:39:10.287	18.44683484039824	79.133108216904	18.44683484039824	79.133108216904	PRESENT	2026-07-16 04:38:53.751
6	1	2026-07-16 06:20:53.991	2026-07-16 06:20:54	2026-07-16 07:33:44.459	18.44683029904585	79.13338499478371	18.4467668942204	79.1333535600681	PRESENT	2026-07-16 06:20:54.004
\.


--
-- Data for Name: Batch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Batch" (id, "batchNumber", "productId", "manufacturingDate", "expiryDate", quantity, "createdAt", "updatedAt") FROM stdin;
4	BAT-000003	12	2026-07-14 00:00:00	2026-07-30 00:00:00	41	2026-07-14 13:42:42.555	2026-07-14 13:42:42.555
5	BAT-000004	10	2026-07-14 00:00:00	2026-07-23 00:00:00	29	2026-07-14 13:43:04.16	2026-07-14 13:43:04.16
6	BAT-000005	10	2026-07-14 00:00:00	2026-08-04 00:00:00	15	2026-07-14 13:43:59.69	2026-07-14 13:43:59.69
7	BAT-000006	14	2026-07-15 00:00:00	2026-10-29 00:00:00	40	2026-07-15 05:03:57.601	2026-07-15 05:03:57.601
8	BAT-000007	15	2026-07-01 00:00:00	2026-09-30 00:00:00	100	2026-07-16 03:58:19.25	2026-07-16 03:58:19.25
9	B-PCM-001	9	2026-01-01 00:00:00	2028-12-31 00:00:00	1010	2026-07-18 06:38:05.707	2026-07-18 06:50:09.261
\.


--
-- Data for Name: Branch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Branch" (id, name, code, address, city, "companyId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Chemist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Chemist" (id, "chemistCode", name, mobile, email, address, territory, "gstNumber", "drugLicenseNumber", "isActive", "createdAt") FROM stdin;
1	CHM-762387	charan	5434554343		kamareddy	Default Territory			t	2026-07-15 06:07:21.962
2	CHM-665570	srinadh	9733744748		kmm	Default Territory			t	2026-07-16 05:55:05.687
3	CHM-878926	one eight			delhi	Default Territory			t	2026-07-16 05:59:28.158
4	CHM-874621	saikiran			karimnagar	Default Territory			t	2026-07-16 06:11:48.535
5	CHM-628381	madhu			khammam	Default Territory			t	2026-07-16 06:12:24.479
6	CHM-947273	pavan			khammam	Default Territory			t	2026-07-16 06:21:20.512
7	CHM-887823	asdfg			gfsdff	Default Territory			t	2026-07-16 06:22:20.013
8	CHM-857771	harish			karimnagar	Default Territory			t	2026-07-16 06:28:13.495
\.


--
-- Data for Name: ChemistVisit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ChemistVisit" (id, "mrId", "chemistId", "visitDate", remarks, "productsDiscussed", "orderValue", latitude, longitude, "createdAt") FROM stdin;
1	1	1	2026-07-15 06:07:21.969			0	18.44706106025037	79.13333109448098	2026-07-15 06:07:21.977
2	1	2	2026-07-16 05:55:05.692			0	18.44683484039824	79.133108216904	2026-07-16 05:55:05.702
3	1	3	2026-07-16 05:59:28.172			0	18.44683484039824	79.133108216904	2026-07-16 05:59:28.185
4	1	3	2026-07-16 06:11:13.36			0	18.44683484039824	79.133108216904	2026-07-16 06:11:13.377
5	1	4	2026-07-16 06:11:48.542			0	18.44683484039824	79.133108216904	2026-07-16 06:11:48.554
6	1	5	2026-07-16 06:12:24.486			0	18.44683484039824	79.133108216904	2026-07-16 06:12:24.5
7	1	6	2026-07-16 06:21:20.517			0	18.44683029904585	79.13338499478371	2026-07-16 06:21:20.526
8	1	7	2026-07-16 06:22:20.018			0	18.44683029904585	79.13338499478371	2026-07-16 06:22:20.026
9	1	7	2026-07-16 06:22:41.454			0	18.44683029904585	79.13338499478371	2026-07-16 06:22:41.467
10	1	8	2026-07-16 06:28:13.508			0	18.44683029904585	79.13338499478371	2026-07-16 06:28:13.519
11	1	7	2026-07-16 07:17:12.517			0	18.44683029904585	79.13338499478371	2026-07-16 07:17:12.534
\.


--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Company" (id, name, email, phone, address, "isActive", "createdAt", "updatedAt") FROM stdin;
1	Default Pharma Company	info@pharmaerp.com	\N	\N	t	2026-07-14 07:41:48.526	2026-07-14 07:41:48.526
\.


--
-- Data for Name: CompanyFeaturePermission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CompanyFeaturePermission" (id, "companyId", "featureId", enabled, "createdAt", "updatedAt") FROM stdin;
1	1	1	t	2026-07-14 13:11:16.04	2026-07-14 13:11:16.04
2	1	2	t	2026-07-14 13:11:16.056	2026-07-14 13:11:16.056
3	1	3	t	2026-07-14 13:11:16.061	2026-07-14 13:11:16.061
\.


--
-- Data for Name: CreditNote; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CreditNote" (id, "cnNo", "cnDate", status, "cnType", reason, remarks, "retailerId", "distributorId", "mrId", "againstInvoiceId", "taxableAmount", "gstAmount", "totalAmount", "amountSettled", "approvedByUserId", "approvedAt", "createdAt") FROM stdin;
1	CN/26/0920	2026-07-18 06:44:50.832	PAID	Sales Return	Expiry Return	the stock was expired	1	\N	\N	1	150	18	168	168	1	2026-07-18 06:50:09.271	2026-07-18 06:44:50.832
2	CN/26/0265	2026-07-18 06:50:58.894	PENDING	Sales Return	Price Adjustment		1	\N	\N	1	75	9	84	0	\N	\N	2026-07-18 06:50:58.894
\.


--
-- Data for Name: CreditNoteItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CreditNoteItem" (id, "creditNoteId", "productId", "batchId", quantity, rate, "gstPercent", "totalAmount", disposition) FROM stdin;
1	1	9	9	10	15	12	168	SALABLE
2	2	9	9	5	15	12	84	SALABLE
\.


--
-- Data for Name: DailyReport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DailyReport" (id, "mrId", "reportDate", "doctorVisits", "chemistVisits", "samplesDistributed", "ordersCollected", remarks, status, "createdAt") FROM stdin;
1	1	2026-07-15 00:00:00	1	1	0	1.000000000000000000000000000000	got good	SUBMITTED	2026-07-15 06:28:48.608
2	1	2026-07-16 00:00:00	0	0	0	1.000000000000000000000000000000		SUBMITTED	2026-07-16 06:54:01.09
3	1	2026-07-16 00:00:00	2	10	0	1.000000000000000000000000000000		Draft	2026-07-16 07:32:38.711
\.


--
-- Data for Name: DeliveryTracking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DeliveryTracking" (id, "lrTrackingId", "receiverName", "receiverMobile", "deliveryDate", status, remarks, "createdAt") FROM stdin;
\.


--
-- Data for Name: Dispatch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Dispatch" (id, "batchId", "warehouseId", "customerName", quantity, "dispatchDate", status, remarks, "createdAt", "createdBy", "createdDate", "dispatchNo", "dispatchType", "driverMobile", "driverName", "lrNumber", "orderId", products, "sourceWarehouse", "totalItems", "totalQuantity", transporter, "vehicleNumber", "expectedDeliveryDate") FROM stdin;
1	\N	2	Metro Pharma Distributors	\N	2026-07-18 10:57:04.368	DELIVERED	\N	2026-07-18 10:57:04.368	System Administrator	2026-07-18	OUT-2026-005	Distributor Order	\N	\N	\N	N/A	[{"rate": 45, "amount": 2250, "batchId": 9, "batchNo": "B-PCM-001", "quantity": 50, "productId": 9, "productCode": "PRD-20260714-131404", "productName": "ghijkl"}]	afgewscvds	1	50	\N	\N	\N
2	\N	2	Care Pharmacy	\N	2026-07-18 11:13:42.048	PENDING	\N	2026-07-18 11:13:42.048	System Administrator	2026-07-18	OUT-2026-006	Distributor Order	\N	\N	\N	N/A	[{"rate": 45, "amount": 2250, "batchId": 9, "batchNo": "B-PCM-001", "quantity": 50, "productId": 9, "productCode": "PRD-20260714-131404", "productName": "ghijkl"}]	afgewscvds	1	50	\N	\N	\N
3	\N	2	Metro Pharma Distributors	\N	2026-07-18 11:14:51.006	DELIVERED	EXPECTED_DELIVERY_DATE: 2026-07-22 | 	2026-07-18 11:14:51.006	System Administrator	2026-07-18	OUT-2026-007	Distributor Order	543354321	gowtham	654321	N/A	[{"rate": 45, "amount": 2700, "batchId": 9, "batchNo": "B-PCM-001", "quantity": 60, "productId": 9, "productCode": "PRD-20260714-131404", "productName": "ghijkl"}]	afgewscvds	1	60	VRL Logistics	234566543	\N
4	\N	6	Metro Pharma Distributors	\N	2026-07-18 12:24:17.877	DELIVERED	EXPECTED_DELIVERY_DATE: 2026-07-30 | 	2026-07-18 12:24:17.877	System Administrator	2026-07-18	OUT-2026-008	Distributor Order	987654567	jashuva	765455	N/A	[{"rate": 35, "amount": 350, "batchId": 7, "batchNo": "BAT-000006", "quantity": 10, "productId": 14, "productCode": "PRD-20260715-103153", "productName": "oxygen"}]	kamareddy warehouse	1	10	Delhivery	876556	\N
\.


--
-- Data for Name: Distributor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Distributor" (id, name, mobile) FROM stdin;
1	Metro Pharma Distributors	9012345678
2	Sri Balaji Agencies	9023456789
3	Venkateshwara Medical Agencies	9034567890
\.


--
-- Data for Name: Doctor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Doctor" (id, "doctorCode", name, specialization, hospital, mobile, email, address, territory, "isActive", "createdAt") FROM stdin;
1	DOC-432074	Dr. Madhu	cardiologist	medicor	2345432343		medicor	Default Territory	t	2026-07-15 06:06:43.098
2	DOC-853961	Dr. charan	mentalist	mental hospital	8433433255		mental hospital	Default Territory	t	2026-07-16 05:54:01.824
\.


--
-- Data for Name: DoctorVisit; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DoctorVisit" (id, "mrId", "doctorId", "visitDate", remarks, "productsDiscussed", "samplesGiven", latitude, longitude, "createdAt") FROM stdin;
1	1	1	2026-07-15 06:06:43.105			0	18.44706106025037	79.13333109448098	2026-07-15 06:06:43.116
2	1	2	2026-07-16 05:54:01.833			0	18.44683484039824	79.133108216904	2026-07-16 05:54:01.847
3	1	2	2026-07-16 07:16:50.334			0	18.44683029904585	79.13338499478371	2026-07-16 07:16:50.349
\.


--
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Expense" (id, "expenseType", amount, remarks, "expenseDate") FROM stdin;
\.


--
-- Data for Name: ExpenseClaim; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExpenseClaim" (id, "mrId", "expenseType", amount, "expenseDate", description, "receiptUrl", status, "submittedAt") FROM stdin;
\.


--
-- Data for Name: Feature; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Feature" (id, name, description, "moduleId", "createdAt", "updatedAt") FROM stdin;
1	Product Master Management	Product Master Management	1	2026-07-14 13:11:16.035	2026-07-14 13:11:16.035
2	Batch Management	Batch Management	1	2026-07-14 13:11:16.055	2026-07-14 13:11:16.055
3	Inventory Management	Inventory Management	1	2026-07-14 13:11:16.059	2026-07-14 13:11:16.059
\.


--
-- Data for Name: FollowUp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FollowUp" (id, "mrId", "doctorId", "chemistId", "meetingId", title, remarks, "followUpDate", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: GSTRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GSTRecord" (id, "hsnCode", description, "gstPercent", "effectiveDate", "createdBy", "lastUpdatedBy", "createdAt", "updatedAt", remarks, status) FROM stdin;
1	9876	this the thing the output is getting	5	2026-07-14 00:00:00	System Administrator	System Administrator	2026-07-14 11:42:40.446	2026-07-14 11:42:40.446	\N	Active
2	5678	hgfggfdsdfgfd	18	2026-07-14 00:00:00	System Administrator	System Administrator	2026-07-14 11:43:01.412	2026-07-14 11:43:01.412	\N	Active
3	4567	not the expected thing happened	28	2026-07-15 00:00:00	System Administrator	System Administrator	2026-07-14 11:52:40.748	2026-07-14 11:53:06.766	jhgffghjhvchjvchjhvcgjhv	Active
4	9876	this the thing the output is getting	12	2026-07-14 00:00:00	System Administrator	System Administrator	2026-07-14 11:55:21.829	2026-07-14 11:55:21.829		Active
5	4534	this is the test from the hub	28	2026-07-15 00:00:00	System Administrator	System Administrator	2026-07-15 04:34:28.326	2026-07-15 04:34:28.326	sdfghjkuytrerhgfddv	Active
6	567890	ben ten is my favourite cartoon	12	2026-07-16 00:00:00	System Administrator	System Administrator	2026-07-16 03:49:13.368	2026-07-16 03:49:13.368	go to heaven	Active
\.


--
-- Data for Name: HSNCode; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."HSNCode" (id, code, description, status, remarks, "createdAt", "updatedAt") FROM stdin;
2	1234	my problme is to solve tge problkem	Active		2026-07-14 11:22:12.381	2026-07-14 11:22:12.381
3	4567	not the expected thing happened	Active		2026-07-14 11:22:41.229	2026-07-14 11:22:41.229
6	4534	this is the test from the hub	Active	dfghhgerccvb	2026-07-15 04:33:54.631	2026-07-15 04:33:54.631
8	234432	vxb czvfsda	Active		2026-07-20 09:30:48.959	2026-07-20 09:30:48.959
\.


--
-- Data for Name: Hospital; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Hospital" (id, name, mobile, address) FROM stdin;
1	Yashoda Hospital	9123456789	Secunderabad
2	Apollo Hospitals	9234567890	Jubilee Hills
3	Care Hospital	9345678901	Banjara Hills
4	Sunshine Clinic	9456789012	Gachibowli
\.


--
-- Data for Name: Income; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Income" (id, "incomeType", amount, remarks, "incomeDate") FROM stdin;
\.


--
-- Data for Name: Inventory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Inventory" (id, "batchId", quantity, "warehouseId") FROM stdin;
1	4	-5	2
2	7	-35	4
3	5	-25	4
4	8	50	6
6	9	900	2
7	9	110	7
5	7	8	6
8	7	10	7
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Invoice" (id, "retailerId", "invoiceNumber", "invoiceDate", "subTotal", "gstAmount", "totalAmount", status, "createdAt") FROM stdin;
1	1	INV-2026-0001	2026-07-18 06:38:20.874	150	18	168	PENDING	2026-07-18 06:38:20.877
\.


--
-- Data for Name: InvoiceItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InvoiceItem" (id, "invoiceId", "productId", quantity, rate, gst, amount) FROM stdin;
1	1	9	10	15	12	168
\.


--
-- Data for Name: InwardStock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InwardStock" (id, "grnNo", date, "supplierId", "warehouseId", "invoiceNumber", "invoiceDate", "itemsCount", "totalQuantity", "totalValue", status, remarks, "createdAt") FROM stdin;
1	GRN-2026-001	2026-07-14 00:00:00	1	2	\N	\N	1	15	510	Completed		2026-07-14 13:46:21.337
2	GRN-2026-002	2026-07-15 00:00:00	1	4	\N	\N	2	120	4200	Completed		2026-07-15 05:06:24.585
3	GRN-2026-003	2026-07-16 00:00:00	2	6	\N	\N	1	50	25	Completed		2026-07-16 04:02:37.008
4	GRN-2026-004	2026-07-17 00:00:00	2	6	\N	\N	1	18	630	Completed		2026-07-17 12:18:39.824
\.


--
-- Data for Name: InwardStockItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InwardStockItem" (id, "inwardStockId", "productId", "batchNo", "mfgDate", "expiryDate", quantity, ptr, mrp, "createdAt") FROM stdin;
1	1	12	BAT-000003	2026-07-14 00:00:00	2026-07-30 00:00:00	15	34	45	2026-07-14 13:46:21.337
2	2	14	BAT-000006	2026-07-15 00:00:00	2026-10-29 00:00:00	70	35	45	2026-07-15 05:06:24.585
3	2	10	BAT-000004	2026-07-14 00:00:00	2026-07-23 00:00:00	50	35	45	2026-07-15 05:06:24.585
4	3	15	BAT-000007	2026-07-01 00:00:00	2026-09-30 00:00:00	50	0.5	5	2026-07-16 04:02:37.008
5	4	14	BAT-000006	2026-07-15 00:00:00	2026-10-29 00:00:00	18	35	24.98	2026-07-17 12:18:39.824
\.


--
-- Data for Name: LRTracking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LRTracking" (id, "transportChallanId", "lrNumber", source, destination, status, "createdAt") FROM stdin;
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Lead" (id, "leadCode", name, type, mobile, email, address, territory, source, status, "assignedMrId", "createdAt") FROM stdin;
\.


--
-- Data for Name: LeaveRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeaveRequest" (id, "mrId", "leaveType", "fromDate", "toDate", reason, status, "appliedAt") FROM stdin;
\.


--
-- Data for Name: Ledger; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Ledger" (id, "retailerId", "transactionType", "referenceNumber", debit, credit, balance, remarks, "createdAt") FROM stdin;
1	1	CREDIT_NOTE_SETTLEMENT	CN/26/0920	0	168	-168	khcxzdfghjk	2026-07-18 06:50:09.269
\.


--
-- Data for Name: MR; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MR" (id, "mrCode", name, mobile, email, territory, "joiningDate", status, "createdAt", "userId") FROM stdin;
1	MR-001	Priya Reddy	8688662767	mr@pharmaerp.com	HQ	2026-07-15 06:03:11.122	ACTIVE	2026-07-15 06:03:11.122	6
\.


--
-- Data for Name: Meeting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Meeting" (id, "mrId", "doctorId", "chemistId", title, description, "meetingDate", location, status, "createdAt") FROM stdin;
1	1	\N	\N	about operations		2026-07-15 09:30:00	\N	SCHEDULED	2026-07-15 06:32:49.717
\.


--
-- Data for Name: MeetingChemist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MeetingChemist" (id, "meetingId", "chemistId") FROM stdin;
\.


--
-- Data for Name: MeetingDoctor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MeetingDoctor" (id, "meetingId", "doctorId") FROM stdin;
\.


--
-- Data for Name: MeetingHospital; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MeetingHospital" (id, "meetingId", "hospitalId") FROM stdin;
\.


--
-- Data for Name: MeetingStockist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MeetingStockist" (id, "meetingId", "stockistId") FROM stdin;
\.


--
-- Data for Name: Module; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Module" (id, name, description, "createdAt", "updatedAt") FROM stdin;
1	Core	Core Module	2026-07-14 13:11:16.026	2026-07-14 13:11:16.026
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, "mrId", title, message, type, "isRead", "createdAt") FROM stdin;
\.


--
-- Data for Name: OutwardStock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OutwardStock" (id, "dispatchNo", date, client, "warehouseId", "referenceNumber", "itemsCount", "totalQuantity", "totalValue", status, remarks, "createdAt") FROM stdin;
1	OUT-2026-001	2026-07-14 00:00:00	Apollo Hospitals	2		1	6	204	Processing	\N	2026-07-14 13:46:43.501
2	OUT-2026-002	2026-07-15 00:00:00	Care Pharmacy	4		1	39	1365	Processing	\N	2026-07-15 05:07:05.016
3	OUT-2026-003	2026-07-15 00:00:00	City Clinic	4		1	20	700	Processing	\N	2026-07-15 05:07:38.233
4	OUT-2026-004	2026-07-16 00:00:00	Apollo Hospitals	6	23456776	1	19	9.5	Processing	\N	2026-07-16 04:03:03.074
5	OUT-2026-005	2026-07-18 00:00:00	Metro Pharma Distributors	2		1	50	2250	Delivered	\N	2026-07-18 10:57:04.332
6	OUT-2026-006	2026-07-18 00:00:00	Care Pharmacy	2		1	50	2250	Processing	\N	2026-07-18 11:13:42.006
7	OUT-2026-007	2026-07-18 00:00:00	Metro Pharma Distributors	2		1	60	2700	Delivered	\N	2026-07-18 11:14:50.988
8	OUT-2026-008	2026-07-18 00:00:00	Metro Pharma Distributors	6		1	10	350	Delivered	\N	2026-07-18 12:24:17.841
\.


--
-- Data for Name: OutwardStockItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OutwardStockItem" (id, "outwardStockId", "productId", "batchId", quantity, rate) FROM stdin;
1	1	12	4	6	34
2	2	14	7	39	35
3	3	10	5	20	35
4	4	15	8	19	0.5
5	5	9	9	50	45
6	6	9	9	50	45
7	7	9	9	60	45
8	8	14	7	10	35
\.


--
-- Data for Name: PackingType; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PackingType" (id, code, description, status, "createdAt", "updatedAt", name, uom) FROM stdin;
1	12345	this is an strip packaging	Active	2026-07-14 11:57:47.277	2026-07-14 12:05:17.392	Strip Packing	Strip
5	3214	hajdks  ahsdfn hasd njd aos js	Active	2026-07-15 04:35:52.688	2026-07-15 04:35:52.688	plastic packing	Vial
6	65748	this is naturally degradable and environment friendly	Active	2026-07-16 03:51:49.523	2026-07-16 03:51:49.523	paper packing	Tube
\.


--
-- Data for Name: PaymentCollection; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PaymentCollection" (id, "invoiceId", amount, "paymentMode", "transactionRef", "paymentDate", remarks, "createdAt") FROM stdin;
\.


--
-- Data for Name: PricingMaster; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PricingMaster" (id, "productId", mrp, ptr, pts, margin, "effectiveDate", "createdAt", "updatedAt", "batchId", status) FROM stdin;
10	15	10	1.5	1.2	20	2026-07-17 00:00:00	2026-07-17 09:07:31.568	2026-07-17 09:07:31.568	\N	Active
11	12	25	21	20	4.76	2026-07-17 00:00:00	2026-07-17 09:09:12.344	2026-07-17 09:09:12.344	\N	Active
12	10	45	28	20	28.57	2026-07-17 00:00:00	2026-07-17 09:16:04.952	2026-07-17 09:16:04.952	\N	Active
13	15	20	5.5	5.2	5.45	2026-07-17 00:00:00	2026-07-17 09:17:29.383	2026-07-17 09:17:29.383	\N	Active
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, name, code, "categoryId", "hsnCode", gst, mrp, ptr, pts, ptd, "companyId", "createdAt", "updatedAt", "minStock", "batchTracking", "brandName", composition, "expiryTracking", "genericName", manufacturer, "packingType", "packsInBox", "purchasePrice", "reorderLevel", scheme, "sellingPrice", status, "totalUnits", type, "unitsPerPack") FROM stdin;
9	ghijkl	PRD-20260714-131404	4	34554323	5	55	45	35	\N	1	2026-07-14 07:44:39.032	2026-07-14 07:44:39.032	0	t		Amoxicillin Trihydrate	t		MediCare	sdfbhgfszxcvgfsa		\N	\N	dont buy anything	\N	Active	0	Injection	
14	oxygen	PRD-20260715-103153	2	9876	12	24.98	35	25	\N	1	2026-07-15 05:02:22.236	2026-07-17 08:56:36.901	0	t	carbon	Paracetamol	t		MediCare	gffgfffgdsdas		\N	\N	buy 100 get 100000	\N	Active	0	Injection	
12	goat	PRD-20260714-184331	2		0	25	21	20	\N	1	2026-07-14 13:13:59.037	2026-07-17 09:15:34.44	0	t		Paracetamol	t		HealthPlus	Strip Packing		\N	\N	buy 100 get 100000	\N	Active	0	Capsule	
10	inked	PRD-20260714-131633	1	30041000	33	45	28	20	\N	1	2026-07-14 07:47:27.242	2026-07-17 09:16:04.975	0	t	hoedajdnak	apple	t		HealthPlus	sdfbhgfszxcvgfsa		\N	\N	but 1000 get 00	\N	Active	0	Tablet	
15	mouse	PRD-20260716-092328	1	567890	12	20	5.5	5.2	\N	1	2026-07-16 03:55:13.84	2026-07-20 09:27:41.775	50	t	biting	poori	t		PharmaCorp	paper packing	50	2	30	buy everything for money	5	Active	500	Capsule	10
\.


--
-- Data for Name: ProductCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductCategory" (id, name, description, "createdAt", "updatedAt") FROM stdin;
1	Antibiotics	\N	2026-07-13 13:36:14.079	2026-07-13 13:36:14.079
2	Analgesics	\N	2026-07-14 07:25:57.644	2026-07-14 07:25:57.644
3	Tablet	\N	2026-07-14 07:36:21.692	2026-07-14 07:36:21.692
4	Antipyretics	\N	2026-07-14 07:44:39.021	2026-07-14 07:44:39.021
\.


--
-- Data for Name: Retailer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Retailer" (id, "stockistId", name, code, mobile, email, address, "gstNumber", "drugLicenseNumber", "isActive", "createdAt") FROM stdin;
1	1	Apollo Pharmacy Store 5	RET001	9876543210	apollo5@pharmacy.com	Main Market, Sector 15	27ABCDE1234F1Z5	\N	t	2026-07-18 06:38:05.686
\.


--
-- Data for Name: RetailerOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RetailerOrder" (id, "retailerId", "orderNumber", "orderDate", "totalAmount", status, "createdAt", "mrId", "chemistId", "hospitalId", "stockistId") FROM stdin;
3	\N	ORD-254722	2026-07-15 06:27:22.334	486	PENDING	2026-07-15 06:27:22.334	1	1	\N	\N
4	\N	ORD-680226	2026-07-16 05:58:37.058	126	PENDING	2026-07-16 05:58:37.058	\N	2	\N	\N
\.


--
-- Data for Name: RetailerOrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RetailerOrderItem" (id, "retailerOrderId", "productId", quantity, rate, amount) FROM stdin;
1	3	14	12	45	486
2	4	15	28	5	126
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RolePermission" (id, "companyId", role, "featureId", "createdAt") FROM stdin;
\.


--
-- Data for Name: SchemeMaster; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SchemeMaster" (id, code, name, "productId", "buyQty", "freeQty", "startDate", "endDate", status, "createdAt", "updatedAt", "batchId", "applicableSelection", "applicableTo", "benefitType", "benefitValue", remarks, type) FROM stdin;
9	SCH-000001	buy 100 get 100000	\N	13	1	2026-07-14 00:00:00	2026-07-30 00:00:00	Active	2026-07-14 12:59:00.77	2026-07-14 12:59:00.77	\N		All Products	Free Quantity	7	xbnvcxzxcvbnvxcvbcxz	Quantity Discount
10	SCH-000002	ntg wants to buy	\N	14	3	2026-07-14 00:00:00	2026-08-15 00:00:00	Active	2026-07-14 12:59:39.506	2026-07-14 12:59:39.506	\N	MediCare	Brand	Free Quantity	5	asdfdgdfsdfgdfsdfgfddfgfsdfgfds	Cash Discount
11	SCH-000003	buy what you want	\N	0	0	2026-07-15 00:00:00	2026-07-20 00:00:00	Active	2026-07-15 04:36:56.395	2026-07-15 04:36:56.395	\N	Tablets	Category	Flat Discount	25	adshb lahfnsv fsdh ahscs	Free Goods
12	SCH-000004	buy everything for money	\N	0	0	2026-07-16 00:00:00	2026-07-20 00:00:00	Active	2026-07-16 03:53:20.299	2026-07-16 03:53:20.299	\N	PharmaCorp	Brand	Cash Back	10	ntg will get freely	Percentage Discount
\.


--
-- Data for Name: StockMovement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StockMovement" (id, quantity, "createdAt", "inventoryId", "movementType", remarks) FROM stdin;
1	10	2026-07-18 06:50:09.248	6	INWARD	Sales Return Credit Note CN/26/0920
2	50	2026-07-18 10:57:42.688	6	OUTWARD	Dispatched outward under Dispatch No OUT-2026-005
3	50	2026-07-18 10:57:57.626	7	INWARD	Received inward under Dispatch No OUT-2026-005
4	60	2026-07-18 11:21:43.746	6	OUTWARD	Dispatched outward under Dispatch No OUT-2026-007
5	60	2026-07-18 11:21:59.647	7	INWARD	Received inward under Dispatch No OUT-2026-007
6	10	2026-07-18 12:24:17.893	5	OUTWARD	Dispatched outward under Dispatch No OUT-2026-008
7	10	2026-07-18 12:27:50.607	8	INWARD	Received inward under Dispatch No OUT-2026-008
\.


--
-- Data for Name: Stockist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Stockist" (id, name, code, mobile, email, address, "gstNumber", "drugLicenseNumber", "isActive", "createdAt") FROM stdin;
1	Metro Stockists Ltd	ST001	9988776655	metro@stockist.com	Industrial Area, Phase 1	27ABCDE9999F1Z5	\N	t	2026-07-18 06:38:05.667
\.


--
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Supplier" (id, name, contact, email, address, "createdAt") FROM stdin;
1	harish	\N	\N	\N	2026-07-14 13:46:01.561
2	charan kamareddy	\N	\N	\N	2026-07-16 04:02:13.848
\.


--
-- Data for Name: Target; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Target" (id, "mrId", month, year, "doctorVisitTarget", "chemistVisitTarget", "orderTarget", "achievedDoctorVisits", "achievedChemistVisits", "achievedOrderValue", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: TerritoryBeat; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TerritoryBeat" (id, area, district, state, "totalDoctors", "totalChemists") FROM stdin;
1	Mumbai Central	Mumbai City	Maharashtra	15	10
2	Bandra-Khar West	Mumbai Suburban	Maharashtra	20	15
3	knr	Kannur	Kerala	10	8
4	pune	Pune	Maharashtra	12	10
5	delhi	New Delhi	Delhi	18	12
\.


--
-- Data for Name: TourPlan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TourPlan" (id, "mrId", "tourDate", territory, objective, status, "createdAt") FROM stdin;
1	1	2026-07-16 00:00:00	clock tower	Field Work	PLANNED	2026-07-15 06:31:02.078
2	1	2026-07-17 00:00:00	fds	Field Work	PLANNED	2026-07-16 06:54:57.008
\.


--
-- Data for Name: TourPlanChemist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TourPlanChemist" (id, "tourPlanId", "chemistId") FROM stdin;
\.


--
-- Data for Name: TourPlanDoctor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TourPlanDoctor" (id, "tourPlanId", "doctorId") FROM stdin;
\.


--
-- Data for Name: TransportChallan; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TransportChallan" (id, "dispatchId", "transporterName", "vehicleNumber", "driverName", "driverMobile", "challanNumber", "createdAt", "actualDeliveryDate", "challanDate", "challanNo", "createdBy", "createdDate", customer, "dispatchDate", "dispatchNo", "orderNo", "podDesignation", "podFileName", "podFileType", "podFileUrl", "podReceivedBy", "podRemarks", "podStatus", "podUploadedBy", "podUploadedDate", products, "sourceWarehouse", status, "totalItems", "totalQty") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, name, email, password, role, "isActive", "createdAt", "updatedAt", "branchId", "companyId", "currentDeviceId", mobile, "profileImage", "linkedDistributorCode", "linkedRetailerCode") FROM stdin;
7	Super Admin	admin@gmail.com	$2b$10$RBIqGTRQ5g5PRO8KCFPhaOp47mYziWLlNi2r9D7/CZeEGsR0AFiNa	SUPER_ADMIN	t	2026-07-13 13:10:06.14	2026-07-13 13:10:06.14	\N	\N	\N	\N	\N	\N	\N
1	System Administrator	superadmin@pharmaerp.com	$2b$10$Z4j.tf2Wqsbrp8lR.9iibOiiMoHmHS6RpKv6btts6T./ZHPHflTga	SUPER_ADMIN	t	2026-07-13 13:10:06.057	2026-07-14 09:55:01.883	\N	1	\N	\N	\N	\N	\N
2	Rahul Sharma	warehouse@pharmaerp.com	$2b$10$Z4j.tf2Wqsbrp8lR.9iibOiiMoHmHS6RpKv6btts6T./ZHPHflTga	WAREHOUSE_MANAGER	t	2026-07-13 13:10:06.066	2026-07-14 09:55:01.901	\N	1	\N	\N	\N	\N	\N
3	Sneha Verma	accounts@pharmaerp.com	$2b$10$Z4j.tf2Wqsbrp8lR.9iibOiiMoHmHS6RpKv6btts6T./ZHPHflTga	ACCOUNTANT	t	2026-07-13 13:10:06.068	2026-07-14 09:55:01.903	\N	1	\N	\N	\N	\N	\N
4	Amit Kumar	distributor@pharmaerp.com	$2b$10$Z4j.tf2Wqsbrp8lR.9iibOiiMoHmHS6RpKv6btts6T./ZHPHflTga	DISTRIBUTOR	t	2026-07-13 13:10:06.07	2026-07-16 12:29:50.319	\N	1	\N	\N	\N	DIST-001	\N
5	Arun Patel	retailer@pharmaerp.com	$2b$10$Z4j.tf2Wqsbrp8lR.9iibOiiMoHmHS6RpKv6btts6T./ZHPHflTga	RETAILER	t	2026-07-13 13:10:06.073	2026-07-16 12:29:50.319	\N	1	\N	\N	\N	\N	RET-001
6	Priya Reddy	mr@pharmaerp.com	$2b$10$5m0cU0LKoPO2R74k2DoutObcISG13cWuSIQBA/HLrEzy2cs1H8BLa	MEDICAL_REPRESENTATIVE	t	2026-07-13 13:10:06.075	2026-07-20 05:56:24.338	\N	1	4b22cb47-e7fa-4d14-b428-2718c7ecda64	8688662767	\N	\N	\N
\.


--
-- Data for Name: Warehouse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Warehouse" (id, name, code, address, "companyId", "createdAt", "updatedAt", branch, city, "contactPerson", country, "createdBy", email, "gstNumber", "licenseNumber", phone, "pinCode", remarks, state, status, type) FROM stdin;
2	afgewscvds	WH-000002	sdfghbgfd	1	2026-07-14 13:45:08.114	2026-07-14 13:45:08.114		sdfhgfds	dfggfdsd	rtfd	System Administrator		thgre	fg34565432	3454554234	434543		hgre	Active	Main Warehouse
3	jackaiajkds,c	WH-000003		1	2026-07-14 13:47:13.09	2026-07-14 13:47:13.09					System Administrator			2345432					Active	Main Warehouse
4	karimnagar 1	WH-000004		1	2026-07-15 05:04:39.776	2026-07-15 05:04:39.776					System Administrator			234567632					Active	Main Warehouse
5	khammam 1	WH-000005		1	2026-07-15 05:04:53.664	2026-07-15 05:04:53.664					System Administrator			43234321					Active	Main Warehouse
6	kamareddy warehouse	WH-000006	kamareddy	1	2026-07-16 04:00:47.669	2026-07-16 04:00:47.669		kamareddy	charan	india	System Administrator	charan@gmail.com	345654345	23476543	9654567876	507165	this is the best warehouse in the world	telangana	Active	Cold Storage
7	Distributor Warehouse (DIST-001)	DIST-001	Central Logistics Hub	1	2026-07-18 07:02:59.403	2026-07-18 07:02:59.403	Default Branch	\N	\N	\N	System	\N	\N	\N	\N	\N	\N	\N	Active	Main Warehouse
8	jjjjj	WH-000007		1	2026-07-20 09:27:38.288	2026-07-20 09:27:38.288					System Administrator			8765e4567					Active	Main Warehouse
\.


--
-- Data for Name: WarehouseTransfer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WarehouseTransfer" (id, "fromWarehouseId", "toWarehouseId", "createdAt", remarks, date, "itemsCount", status, "totalQuantity", "transferNo") FROM stdin;
1	2	3	2026-07-14 13:47:30.586		2026-07-14 00:00:00	1	In Transit	7	TRF-2026-001
2	4	5	2026-07-15 05:08:19.44		2026-07-15 00:00:00	1	In Transit	25	TRF-2026-002
3	4	2	2026-07-15 05:08:57.92		2026-07-15 00:00:00	1	In Transit	35	TRF-2026-003
4	6	5	2026-07-16 04:04:12.25	safe stock transfer	2026-07-20 00:00:00	1	In Transit	30	TRF-2026-004
\.


--
-- Data for Name: WarehouseTransferItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."WarehouseTransferItem" (id, "warehouseTransferId", "productId", "batchId", quantity, "createdAt") FROM stdin;
1	1	12	4	7	2026-07-14 13:47:30.586
2	2	10	5	25	2026-07-15 05:08:19.44
3	3	14	7	35	2026-07-15 05:08:57.92
4	4	15	8	30	2026-07-16 04:04:12.25
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
04f479e1-416e-453b-b0f6-c31327f5efb0	d0b8cf0ae80cec92dad013dc3a49699f13a092357a6c6d70ee976f7ba0464467	2026-07-13 06:10:04.661038-07	20260617103131_add_payment_collection	\N	\N	2026-07-13 06:10:04.642593-07	1
c971c0e0-c3fa-43c6-b9f6-84697626ba15	06c3a4b268927f9cf5c4e94fc19003408ec04a582cdd64acfe23c9d4596df7f0	2026-07-13 06:10:04.315263-07	20260527100055_init	\N	\N	2026-07-13 06:10:04.282249-07	1
6b3ff2ae-b093-492b-afee-1e08521b2c69	7752b53281f04b71550c04e020a4ba18852b4f75166aaf56abcc95247d00fb3f	2026-07-13 06:10:04.542006-07	20260616113645_add_dispatch	\N	\N	2026-07-13 06:10:04.530174-07	1
c9f440dc-af50-4bda-99be-8eede4ba42d8	2b7439ed39cbae23e5893104a3cdb063a9fa195d3b41fc4934a4f97976d32ad8	2026-07-13 06:10:04.330065-07	20260610115224_role_cleanup	\N	\N	2026-07-13 06:10:04.316192-07	1
b9df0e2a-0005-494d-9781-252936190c06	29669f96add71921b0dfa34bfa01b5b4bb7112bd81b216bb21d61af089758111	2026-07-13 06:10:04.333272-07	20260610131023_add_super_admin	\N	\N	2026-07-13 06:10:04.330875-07	1
58c49d74-6ff5-4592-a5f3-81957d3e5abd	19adbe0af3b3dbe408c27ec7aff219ac2cd8e33229912212394cc0cef984b162	2026-07-13 06:10:04.365643-07	20260611080400_add_company_branch_structure	\N	\N	2026-07-13 06:10:04.333913-07	1
7ea85272-c186-492d-bef6-b980b35baa3d	d9654ad3acfb151b7a076d9e326d1d3abb958d6b369cf1ad06a1edbc2885a426	2026-07-13 06:10:04.55373-07	20260616115656_add_transport_challan	\N	\N	2026-07-13 06:10:04.542681-07	1
9c4a63a9-3a12-486f-8712-c62c112420e2	42a019ae8bbff5e1dc0a8512bb58690ce5306f21ce7fa2223326b9074ecb384f	2026-07-13 06:10:04.392279-07	20260611120704_add_module_feature_permissions	\N	\N	2026-07-13 06:10:04.366302-07	1
3da32e0e-0f79-4e18-813b-37cbda73d0de	d71d857a598bacb758d40867463c1b9e3ca34e19a39d31547ed0ac7e871f5938	2026-07-13 06:10:04.4008-07	20260612102945_add_role_permissions	\N	\N	2026-07-13 06:10:04.392923-07	1
1ed711ad-7002-4c43-82b5-395773bcc65b	98066dac5b7d73597b004b4dc17ec5836386178b37938d1fda1b46e7ae2cc50d	2026-07-13 06:10:04.797428-07	20260619054309_add_meeting_module	\N	\N	2026-07-13 06:10:04.787552-07	1
6a8656d2-7fdd-471c-a109-e5aac97195a5	a6a18598917dbfd7543aa16a956df8ac0d87684aff1729043e208be522c9b542	2026-07-13 06:10:04.462723-07	20260612132146_add_products	\N	\N	2026-07-13 06:10:04.401569-07	1
d080ee54-0a3d-48af-a1f9-ed8d1ddc60e7	aa9ff9fe7df3f84e6548f13cbded51defdf96856b06cc53d7d8341988837d6a4	2026-07-13 06:10:04.565918-07	20260616120807_add_lr_tracking	\N	\N	2026-07-13 06:10:04.554634-07	1
b7704907-7da9-4172-8095-2b700c210fef	d810ed08f2d7263c16246f5900d0d736dad63f14b24ff10d80b69069f2747fbd	2026-07-13 06:10:04.468621-07	20260612132652_add_products	\N	\N	2026-07-13 06:10:04.463435-07	1
d10e78ae-f900-4c8c-b4c0-3a3b34ebbb92	10ba3054b26d8bbce7930296a4d0859df590a49b4bafb2bf9e7dc153915a3694	2026-07-13 06:10:04.477142-07	20260613105301_add_inventory	\N	\N	2026-07-13 06:10:04.469283-07	1
5604974b-2d43-411e-9e13-cc134cd60a65	2225c7d657fdde777961b6a4559d3321dd1a6d00822fe2b6706b52acf0d021bc	2026-07-13 06:10:04.670047-07	20260617111852_add_ledger	\N	\N	2026-07-13 06:10:04.661723-07	1
2b8cc93c-da35-4e8d-8df6-633da8178f0c	4553bf6c9a48cd903afcda06e6e87d9676364ceb770bbf0fcacb116f4fd90104	2026-07-13 06:10:04.482952-07	20260613105548_add_inventory	\N	\N	2026-07-13 06:10:04.477811-07	1
69d81b7a-4e43-4b59-8f29-aacd1a97cb75	c73fc50f705b864bdee38f00c1938086273aa0a4f65264266723ee555a5726ad	2026-07-13 06:10:04.576597-07	20260616122103_add_delivery_tracking	\N	\N	2026-07-13 06:10:04.566794-07	1
a0481431-a4b9-4664-ba13-b9c4b81f55b0	87b4dd38efd33bf170dc22d7e3f140a29697e5526056e94ecf3d6997dd874427	2026-07-13 06:10:04.516354-07	20260615062756_add_warehouse	\N	\N	2026-07-13 06:10:04.483804-07	1
1de66639-bba3-462a-a14c-81deb1e7a197	d9da71b50f3960347b3e65ab6da84ee616d53f48f313802c93fdc737de318799	2026-07-13 06:10:04.521817-07	20260615071126_add_stock_movement	\N	\N	2026-07-13 06:10:04.517171-07	1
8d9827ac-3766-4287-b42a-6000717b5768	ff0024d6e769d61e0b6a46c062a645de4c456294a7ca6993c13ccf6239b01b5f	2026-07-13 06:10:04.529579-07	20260615123943_add_warehouse_transfer	\N	\N	2026-07-13 06:10:04.522508-07	1
6cebb3db-2f41-46a0-b8ee-8e7852566d41	6a56289033e5f1bf81bf215aaca9a58884683fe509b3a79836b7157ce74cdd4c	2026-07-13 06:10:04.588502-07	20260616123301_add_stockist	\N	\N	2026-07-13 06:10:04.577857-07	1
3ea63058-8c03-450f-b9e6-4de6e9316617	2dde12589f14b46e48f691af4b982558f0963e731a7dee0fc6d22ed451945709	2026-07-13 06:10:04.724222-07	20260618091035_add_attendance	\N	\N	2026-07-13 06:10:04.713394-07	1
e68aa70c-4c14-44fb-8308-79aa15b42bf8	68889759c80bb53f2d67e0d2448515ae6e289999704516ceb75d06a449b4b2be	2026-07-13 06:10:04.602565-07	20260616125646_add_retailer	\N	\N	2026-07-13 06:10:04.589629-07	1
bd75d00c-0f7a-4754-aad7-aa36557cbb74	3bd32af03868a8286e61bb1f25defa75d3c520a707f2fd808b2b6da91ed24390	2026-07-13 06:10:04.682423-07	20260617123603_add_accounting	\N	\N	2026-07-13 06:10:04.670865-07	1
f5aa31ec-3c29-419b-a9b9-a2abfa118da8	8de2960315fbcb873565a36a1e9b464090823097d73eca2da1331dd58d82213e	2026-07-13 06:10:04.625021-07	20260616133117_add_invoice	\N	\N	2026-07-13 06:10:04.603275-07	1
6e8956c4-5f5b-43f5-b39f-ba921513c509	8465e21129b59469e62a7e575e32dfb3cc63ceea8660914e05751334293afd82	2026-07-13 06:10:04.641924-07	20260617060327_add_retailer_order	\N	\N	2026-07-13 06:10:04.625836-07	1
d54efca5-2ceb-489c-b2f0-30331af25008	5b1428dd2f2dfd32f97878d96465a9d5300bf5a0742dc34f6868b0938ed91aca	2026-07-13 06:10:04.7764-07	20260618133039_add_daily_report	\N	\N	2026-07-13 06:10:04.766325-07	1
a40e30c5-901f-4e1b-92c3-6ca4ab2fd2ea	6badce0ea0859f220fba54f43cbf77038ba84c1d7a34d615a6bdca09e4d61d5c	2026-07-13 06:10:04.693746-07	20260618065252_add_mr	\N	\N	2026-07-13 06:10:04.683157-07	1
b1ceb4b6-0034-443c-90e8-6792b2aa0e9d	03b2675722fc8350c8538de932da35530e26ac1825fb1a16e61d91e1c52eb1be	2026-07-13 06:10:04.734082-07	20260618103310_add_doctor_visit	\N	\N	2026-07-13 06:10:04.724895-07	1
be59cefc-ad78-480a-a674-f1c7a797f0c1	8898e39b77572b695b0e9b4947e788196fd7ea27178640faed5cad618b5349eb	2026-07-13 06:10:04.702041-07	20260618070818_add_doctor	\N	\N	2026-07-13 06:10:04.69434-07	1
686e11b7-9757-4856-9db0-06752ee22282	bb861dc805ae75c254db9115f91862fd442d2d3f2c70aa68cdbe3782c7ea42bd	2026-07-13 06:10:04.712732-07	20260618075531_add_chemist	\N	\N	2026-07-13 06:10:04.702693-07	1
a46ce5ab-29e6-4c50-8700-91b64011e2de	e3da0671f0fce282bd6a142848674d66916509488ed42f967eccaa33372e900a	2026-07-13 06:10:04.746658-07	20260618112127_add_chemist_visit	\N	\N	2026-07-13 06:10:04.73469-07	1
965e0f52-1e43-4837-8d62-678b00bb2cc2	a768976d9a15aa57c4bc3e75911fd2b75c24f2c6ae56f3e98ec6110f5134f2c5	2026-07-13 06:10:04.765627-07	20260618120235_add_tour_plan	\N	\N	2026-07-13 06:10:04.747412-07	1
e078f595-52e6-4003-89bf-f1217a026f54	5f82b8be2401784f1e1c7f78a8f95e3016f2cf1e663fd2cdd7daad7e01def974	2026-07-13 06:10:04.786525-07	20260619050941_add_target_tracking	\N	\N	2026-07-13 06:10:04.777084-07	1
7edc7d7e-aa44-4869-9592-42a7a66dd084	cc8aafd475f39b36c2331b122d05e7e6d512ad970a4d076c2db3ed28052db04a	2026-07-13 06:10:04.824436-07	20260619093450_add_followup_module	\N	\N	2026-07-13 06:10:04.814412-07	1
c35e3d36-cbfc-463d-bf28-469a34f97f6f	cd73fe6c38c1a3cf9eba8b9db819ad7bedbbb9d9f52036189ca301a36414c796	2026-07-13 06:10:04.813741-07	20260619060247_add_meeting_module	\N	\N	2026-07-13 06:10:04.798303-07	1
fa9f99ad-dd27-4525-996f-cf955272402e	2b86fdc425172503137ca9e586b179482c69bdc776084fe676d0bac8c1910829	2026-07-13 06:10:04.833355-07	20260619103942_add_activity_tracking	\N	\N	2026-07-13 06:10:04.825111-07	1
d238ffe1-f602-4c2e-ae05-3f7936933331	b3fd36c0b44a2ac111230cc44211e48386b60fab232fb39385fc1d45f23cec4f	2026-07-13 06:10:04.844514-07	20260619110507_add_lead_crm	\N	\N	2026-07-13 06:10:04.834215-07	1
9e2cb947-f466-4dc2-a02c-ddeb5fd97e2d	efc918f9b1d3e2bea39b7de4174e52257d40db7f9308ce4bac3c4850f0131c78	2026-07-13 06:10:04.853357-07	20260619114428_add_leave_request	\N	\N	2026-07-13 06:10:04.845238-07	1
ac2b4b7d-1266-4c9c-bc4e-c119c3550a79	5c5f8361745ce53d64ae337e1c86d29eba9663289f5cc30cd93f9ba126948da9	2026-07-13 06:10:04.862776-07	20260619132910_add_expense_claims	\N	\N	2026-07-13 06:10:04.854339-07	1
70ecf901-a0e9-4ad1-a7d4-fd954a8dac41	78712773b38049b114e7fc527125a8429a3fd3270e8d482bc4fc267dd9abd867	2026-07-13 06:10:04.874803-07	20260619134536_add_notifications	\N	\N	2026-07-13 06:10:04.863477-07	1
9c189ef8-50a4-45f7-9aa5-8c51afe8e800	05eb9a32c87d2ba4a1bf6b8c7d5bb87ff15506c48d9b4906516aa2ef070557a8	2026-07-13 06:10:04.880397-07	20260621093710_add_user_mr_relation	\N	\N	2026-07-13 06:10:04.875479-07	1
7489b887-1d7b-434f-9e47-a72a4802e111	2ffde85272cf63712b9398d8d672003510d2fdd15b42fd3f2818590c9e43f7ef	2026-07-13 06:10:04.885351-07	20260706064958_extend_product_fields	\N	\N	2026-07-13 06:10:04.881057-07	1
29c10030-04eb-4065-a6e3-e13a736ec5cc	9ba727b230c22a408330d5ddcbd127573accb35058e43a22a3e115df7d197562	2026-07-13 06:10:04.942957-07	20260710051039_sync_schema	\N	\N	2026-07-13 06:10:04.886064-07	1
35124747-2fdb-4d22-836e-fa818d34871c	d76b0dd1d28d8c72b19c7d278f0f6e994acdbc0371a8dd3a08ebb208a4236a97	2026-07-13 06:10:05.005924-07	20260711132000_add_inward_outward_supplier_warehouse_transfer	\N	\N	2026-07-13 06:10:04.943914-07	1
66f965f0-0802-4098-b305-2b74150c4719	c987962439af25079268bfed702a08a9e7f236146ef64159b447c962dcffde11	2026-07-14 03:50:41.871014-07	20260714105041_add_product_master_tables	\N	\N	2026-07-14 03:50:41.61893-07	1
\.


--
-- Name: Activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Activity_id_seq"', 1, false);


--
-- Name: Attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Attendance_id_seq"', 6, true);


--
-- Name: Batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Batch_id_seq"', 9, true);


--
-- Name: Branch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Branch_id_seq"', 1, false);


--
-- Name: ChemistVisit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ChemistVisit_id_seq"', 11, true);


--
-- Name: Chemist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Chemist_id_seq"', 8, true);


--
-- Name: CompanyFeaturePermission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."CompanyFeaturePermission_id_seq"', 3, true);


--
-- Name: Company_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Company_id_seq"', 1, false);


--
-- Name: CreditNoteItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."CreditNoteItem_id_seq"', 2, true);


--
-- Name: CreditNote_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."CreditNote_id_seq"', 2, true);


--
-- Name: DailyReport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DailyReport_id_seq"', 3, true);


--
-- Name: DeliveryTracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DeliveryTracking_id_seq"', 1, false);


--
-- Name: Dispatch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Dispatch_id_seq"', 4, true);


--
-- Name: Distributor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Distributor_id_seq"', 3, true);


--
-- Name: DoctorVisit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DoctorVisit_id_seq"', 3, true);


--
-- Name: Doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Doctor_id_seq"', 2, true);


--
-- Name: ExpenseClaim_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ExpenseClaim_id_seq"', 1, false);


--
-- Name: Expense_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Expense_id_seq"', 1, false);


--
-- Name: Feature_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Feature_id_seq"', 3, true);


--
-- Name: FollowUp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."FollowUp_id_seq"', 1, false);


--
-- Name: GSTRecord_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GSTRecord_id_seq"', 6, true);


--
-- Name: HSNCode_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."HSNCode_id_seq"', 8, true);


--
-- Name: Hospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Hospital_id_seq"', 4, true);


--
-- Name: Income_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Income_id_seq"', 1, false);


--
-- Name: Inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Inventory_id_seq"', 8, true);


--
-- Name: InvoiceItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."InvoiceItem_id_seq"', 1, true);


--
-- Name: Invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Invoice_id_seq"', 1, true);


--
-- Name: InwardStockItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."InwardStockItem_id_seq"', 5, true);


--
-- Name: InwardStock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."InwardStock_id_seq"', 4, true);


--
-- Name: LRTracking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."LRTracking_id_seq"', 1, false);


--
-- Name: Lead_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Lead_id_seq"', 1, false);


--
-- Name: LeaveRequest_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."LeaveRequest_id_seq"', 1, false);


--
-- Name: Ledger_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Ledger_id_seq"', 1, true);


--
-- Name: MR_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."MR_id_seq"', 1, true);


--
-- Name: MeetingChemist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."MeetingChemist_id_seq"', 1, false);


--
-- Name: MeetingDoctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."MeetingDoctor_id_seq"', 1, false);


--
-- Name: MeetingHospital_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."MeetingHospital_id_seq"', 1, false);


--
-- Name: MeetingStockist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."MeetingStockist_id_seq"', 1, false);


--
-- Name: Meeting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Meeting_id_seq"', 1, true);


--
-- Name: Module_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Module_id_seq"', 1, true);


--
-- Name: Notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Notification_id_seq"', 1, false);


--
-- Name: OutwardStockItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."OutwardStockItem_id_seq"', 8, true);


--
-- Name: OutwardStock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."OutwardStock_id_seq"', 8, true);


--
-- Name: PackingType_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PackingType_id_seq"', 6, true);


--
-- Name: PaymentCollection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PaymentCollection_id_seq"', 1, false);


--
-- Name: PricingMaster_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PricingMaster_id_seq"', 13, true);


--
-- Name: ProductCategory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ProductCategory_id_seq"', 4, true);


--
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Product_id_seq"', 15, true);


--
-- Name: RetailerOrderItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."RetailerOrderItem_id_seq"', 2, true);


--
-- Name: RetailerOrder_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."RetailerOrder_id_seq"', 4, true);


--
-- Name: Retailer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Retailer_id_seq"', 1, true);


--
-- Name: RolePermission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."RolePermission_id_seq"', 1, false);


--
-- Name: SchemeMaster_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."SchemeMaster_id_seq"', 12, true);


--
-- Name: StockMovement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."StockMovement_id_seq"', 7, true);


--
-- Name: Stockist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Stockist_id_seq"', 1, true);


--
-- Name: Supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Supplier_id_seq"', 2, true);


--
-- Name: Target_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Target_id_seq"', 1, false);


--
-- Name: TerritoryBeat_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."TerritoryBeat_id_seq"', 5, true);


--
-- Name: TourPlanChemist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."TourPlanChemist_id_seq"', 1, false);


--
-- Name: TourPlanDoctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."TourPlanDoctor_id_seq"', 1, false);


--
-- Name: TourPlan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."TourPlan_id_seq"', 2, true);


--
-- Name: TransportChallan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."TransportChallan_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."User_id_seq"', 13, true);


--
-- Name: WarehouseTransferItem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."WarehouseTransferItem_id_seq"', 4, true);


--
-- Name: WarehouseTransfer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."WarehouseTransfer_id_seq"', 4, true);


--
-- Name: Warehouse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Warehouse_id_seq"', 8, true);


--
-- Name: Activity Activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: Batch Batch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_pkey" PRIMARY KEY (id);


--
-- Name: Branch Branch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_pkey" PRIMARY KEY (id);


--
-- Name: ChemistVisit ChemistVisit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChemistVisit"
    ADD CONSTRAINT "ChemistVisit_pkey" PRIMARY KEY (id);


--
-- Name: Chemist Chemist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Chemist"
    ADD CONSTRAINT "Chemist_pkey" PRIMARY KEY (id);


--
-- Name: CompanyFeaturePermission CompanyFeaturePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CompanyFeaturePermission"
    ADD CONSTRAINT "CompanyFeaturePermission_pkey" PRIMARY KEY (id);


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: CreditNoteItem CreditNoteItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNoteItem"
    ADD CONSTRAINT "CreditNoteItem_pkey" PRIMARY KEY (id);


--
-- Name: CreditNote CreditNote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNote"
    ADD CONSTRAINT "CreditNote_pkey" PRIMARY KEY (id);


--
-- Name: DailyReport DailyReport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DailyReport"
    ADD CONSTRAINT "DailyReport_pkey" PRIMARY KEY (id);


--
-- Name: DeliveryTracking DeliveryTracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeliveryTracking"
    ADD CONSTRAINT "DeliveryTracking_pkey" PRIMARY KEY (id);


--
-- Name: Dispatch Dispatch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Dispatch"
    ADD CONSTRAINT "Dispatch_pkey" PRIMARY KEY (id);


--
-- Name: Distributor Distributor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Distributor"
    ADD CONSTRAINT "Distributor_pkey" PRIMARY KEY (id);


--
-- Name: DoctorVisit DoctorVisit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorVisit"
    ADD CONSTRAINT "DoctorVisit_pkey" PRIMARY KEY (id);


--
-- Name: Doctor Doctor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Doctor"
    ADD CONSTRAINT "Doctor_pkey" PRIMARY KEY (id);


--
-- Name: ExpenseClaim ExpenseClaim_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExpenseClaim"
    ADD CONSTRAINT "ExpenseClaim_pkey" PRIMARY KEY (id);


--
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- Name: Feature Feature_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Feature"
    ADD CONSTRAINT "Feature_pkey" PRIMARY KEY (id);


--
-- Name: FollowUp FollowUp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FollowUp"
    ADD CONSTRAINT "FollowUp_pkey" PRIMARY KEY (id);


--
-- Name: GSTRecord GSTRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GSTRecord"
    ADD CONSTRAINT "GSTRecord_pkey" PRIMARY KEY (id);


--
-- Name: HSNCode HSNCode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HSNCode"
    ADD CONSTRAINT "HSNCode_pkey" PRIMARY KEY (id);


--
-- Name: Hospital Hospital_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Hospital"
    ADD CONSTRAINT "Hospital_pkey" PRIMARY KEY (id);


--
-- Name: Income Income_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Income"
    ADD CONSTRAINT "Income_pkey" PRIMARY KEY (id);


--
-- Name: Inventory Inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceItem InvoiceItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: InwardStockItem InwardStockItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InwardStockItem"
    ADD CONSTRAINT "InwardStockItem_pkey" PRIMARY KEY (id);


--
-- Name: InwardStock InwardStock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InwardStock"
    ADD CONSTRAINT "InwardStock_pkey" PRIMARY KEY (id);


--
-- Name: LRTracking LRTracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LRTracking"
    ADD CONSTRAINT "LRTracking_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: LeaveRequest LeaveRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY (id);


--
-- Name: Ledger Ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ledger"
    ADD CONSTRAINT "Ledger_pkey" PRIMARY KEY (id);


--
-- Name: MR MR_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MR"
    ADD CONSTRAINT "MR_pkey" PRIMARY KEY (id);


--
-- Name: MeetingChemist MeetingChemist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingChemist"
    ADD CONSTRAINT "MeetingChemist_pkey" PRIMARY KEY (id);


--
-- Name: MeetingDoctor MeetingDoctor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingDoctor"
    ADD CONSTRAINT "MeetingDoctor_pkey" PRIMARY KEY (id);


--
-- Name: MeetingHospital MeetingHospital_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingHospital"
    ADD CONSTRAINT "MeetingHospital_pkey" PRIMARY KEY (id);


--
-- Name: MeetingStockist MeetingStockist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingStockist"
    ADD CONSTRAINT "MeetingStockist_pkey" PRIMARY KEY (id);


--
-- Name: Meeting Meeting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_pkey" PRIMARY KEY (id);


--
-- Name: Module Module_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Module"
    ADD CONSTRAINT "Module_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OutwardStockItem OutwardStockItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutwardStockItem"
    ADD CONSTRAINT "OutwardStockItem_pkey" PRIMARY KEY (id);


--
-- Name: OutwardStock OutwardStock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutwardStock"
    ADD CONSTRAINT "OutwardStock_pkey" PRIMARY KEY (id);


--
-- Name: PackingType PackingType_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PackingType"
    ADD CONSTRAINT "PackingType_pkey" PRIMARY KEY (id);


--
-- Name: PaymentCollection PaymentCollection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentCollection"
    ADD CONSTRAINT "PaymentCollection_pkey" PRIMARY KEY (id);


--
-- Name: PricingMaster PricingMaster_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PricingMaster"
    ADD CONSTRAINT "PricingMaster_pkey" PRIMARY KEY (id);


--
-- Name: ProductCategory ProductCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductCategory"
    ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: RetailerOrderItem RetailerOrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrderItem"
    ADD CONSTRAINT "RetailerOrderItem_pkey" PRIMARY KEY (id);


--
-- Name: RetailerOrder RetailerOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrder"
    ADD CONSTRAINT "RetailerOrder_pkey" PRIMARY KEY (id);


--
-- Name: Retailer Retailer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Retailer"
    ADD CONSTRAINT "Retailer_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY (id);


--
-- Name: SchemeMaster SchemeMaster_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchemeMaster"
    ADD CONSTRAINT "SchemeMaster_pkey" PRIMARY KEY (id);


--
-- Name: StockMovement StockMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_pkey" PRIMARY KEY (id);


--
-- Name: Stockist Stockist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Stockist"
    ADD CONSTRAINT "Stockist_pkey" PRIMARY KEY (id);


--
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- Name: Target Target_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Target"
    ADD CONSTRAINT "Target_pkey" PRIMARY KEY (id);


--
-- Name: TerritoryBeat TerritoryBeat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TerritoryBeat"
    ADD CONSTRAINT "TerritoryBeat_pkey" PRIMARY KEY (id);


--
-- Name: TourPlanChemist TourPlanChemist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlanChemist"
    ADD CONSTRAINT "TourPlanChemist_pkey" PRIMARY KEY (id);


--
-- Name: TourPlanDoctor TourPlanDoctor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlanDoctor"
    ADD CONSTRAINT "TourPlanDoctor_pkey" PRIMARY KEY (id);


--
-- Name: TourPlan TourPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlan"
    ADD CONSTRAINT "TourPlan_pkey" PRIMARY KEY (id);


--
-- Name: TransportChallan TransportChallan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransportChallan"
    ADD CONSTRAINT "TransportChallan_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: WarehouseTransferItem WarehouseTransferItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WarehouseTransferItem"
    ADD CONSTRAINT "WarehouseTransferItem_pkey" PRIMARY KEY (id);


--
-- Name: WarehouseTransfer WarehouseTransfer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WarehouseTransfer"
    ADD CONSTRAINT "WarehouseTransfer_pkey" PRIMARY KEY (id);


--
-- Name: Warehouse Warehouse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Chemist_chemistCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Chemist_chemistCode_key" ON public."Chemist" USING btree ("chemistCode");


--
-- Name: CompanyFeaturePermission_companyId_featureId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CompanyFeaturePermission_companyId_featureId_key" ON public."CompanyFeaturePermission" USING btree ("companyId", "featureId");


--
-- Name: CreditNote_cnNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CreditNote_cnNo_key" ON public."CreditNote" USING btree ("cnNo");


--
-- Name: Doctor_doctorCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Doctor_doctorCode_key" ON public."Doctor" USING btree ("doctorCode");


--
-- Name: HSNCode_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "HSNCode_code_key" ON public."HSNCode" USING btree (code);


--
-- Name: Invoice_invoiceNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON public."Invoice" USING btree ("invoiceNumber");


--
-- Name: InwardStock_grnNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InwardStock_grnNo_key" ON public."InwardStock" USING btree ("grnNo");


--
-- Name: LRTracking_lrNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LRTracking_lrNumber_key" ON public."LRTracking" USING btree ("lrNumber");


--
-- Name: Lead_leadCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Lead_leadCode_key" ON public."Lead" USING btree ("leadCode");


--
-- Name: MR_mrCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MR_mrCode_key" ON public."MR" USING btree ("mrCode");


--
-- Name: MR_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "MR_userId_key" ON public."MR" USING btree ("userId");


--
-- Name: Module_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Module_name_key" ON public."Module" USING btree (name);


--
-- Name: OutwardStock_dispatchNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OutwardStock_dispatchNo_key" ON public."OutwardStock" USING btree ("dispatchNo");


--
-- Name: PackingType_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PackingType_code_key" ON public."PackingType" USING btree (code);


--
-- Name: ProductCategory_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProductCategory_name_key" ON public."ProductCategory" USING btree (name);


--
-- Name: Product_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Product_code_key" ON public."Product" USING btree (code);


--
-- Name: RetailerOrder_orderNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "RetailerOrder_orderNumber_key" ON public."RetailerOrder" USING btree ("orderNumber");


--
-- Name: Retailer_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Retailer_code_key" ON public."Retailer" USING btree (code);


--
-- Name: SchemeMaster_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "SchemeMaster_code_key" ON public."SchemeMaster" USING btree (code);


--
-- Name: Stockist_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Stockist_code_key" ON public."Stockist" USING btree (code);


--
-- Name: Supplier_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Supplier_name_key" ON public."Supplier" USING btree (name);


--
-- Name: TransportChallan_challanNumber_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TransportChallan_challanNumber_key" ON public."TransportChallan" USING btree ("challanNumber");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: WarehouseTransfer_transferNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "WarehouseTransfer_transferNo_key" ON public."WarehouseTransfer" USING btree ("transferNo");


--
-- Name: Warehouse_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Warehouse_code_key" ON public."Warehouse" USING btree (code);


--
-- Name: Activity Activity_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attendance Attendance_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Batch Batch_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Batch"
    ADD CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Branch Branch_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Branch"
    ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChemistVisit ChemistVisit_chemistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChemistVisit"
    ADD CONSTRAINT "ChemistVisit_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES public."Chemist"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ChemistVisit ChemistVisit_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ChemistVisit"
    ADD CONSTRAINT "ChemistVisit_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CompanyFeaturePermission CompanyFeaturePermission_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CompanyFeaturePermission"
    ADD CONSTRAINT "CompanyFeaturePermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CompanyFeaturePermission CompanyFeaturePermission_featureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CompanyFeaturePermission"
    ADD CONSTRAINT "CompanyFeaturePermission_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES public."Feature"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CreditNoteItem CreditNoteItem_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNoteItem"
    ADD CONSTRAINT "CreditNoteItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CreditNoteItem CreditNoteItem_creditNoteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNoteItem"
    ADD CONSTRAINT "CreditNoteItem_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES public."CreditNote"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CreditNoteItem CreditNoteItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNoteItem"
    ADD CONSTRAINT "CreditNoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CreditNote CreditNote_againstInvoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNote"
    ADD CONSTRAINT "CreditNote_againstInvoiceId_fkey" FOREIGN KEY ("againstInvoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CreditNote CreditNote_approvedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNote"
    ADD CONSTRAINT "CreditNote_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CreditNote CreditNote_distributorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNote"
    ADD CONSTRAINT "CreditNote_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES public."Distributor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CreditNote CreditNote_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNote"
    ADD CONSTRAINT "CreditNote_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CreditNote CreditNote_retailerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CreditNote"
    ADD CONSTRAINT "CreditNote_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES public."Retailer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DailyReport DailyReport_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DailyReport"
    ADD CONSTRAINT "DailyReport_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DeliveryTracking DeliveryTracking_lrTrackingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DeliveryTracking"
    ADD CONSTRAINT "DeliveryTracking_lrTrackingId_fkey" FOREIGN KEY ("lrTrackingId") REFERENCES public."LRTracking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Dispatch Dispatch_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Dispatch"
    ADD CONSTRAINT "Dispatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Dispatch Dispatch_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Dispatch"
    ADD CONSTRAINT "Dispatch_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DoctorVisit DoctorVisit_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorVisit"
    ADD CONSTRAINT "DoctorVisit_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DoctorVisit DoctorVisit_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DoctorVisit"
    ADD CONSTRAINT "DoctorVisit_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExpenseClaim ExpenseClaim_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExpenseClaim"
    ADD CONSTRAINT "ExpenseClaim_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Feature Feature_moduleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Feature"
    ADD CONSTRAINT "Feature_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES public."Module"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FollowUp FollowUp_chemistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FollowUp"
    ADD CONSTRAINT "FollowUp_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES public."Chemist"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FollowUp FollowUp_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FollowUp"
    ADD CONSTRAINT "FollowUp_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FollowUp FollowUp_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FollowUp"
    ADD CONSTRAINT "FollowUp_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FollowUp FollowUp_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FollowUp"
    ADD CONSTRAINT "FollowUp_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Inventory Inventory_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Inventory Inventory_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Inventory"
    ADD CONSTRAINT "Inventory_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceItem InvoiceItem_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceItem InvoiceItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InvoiceItem"
    ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_retailerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES public."Retailer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InwardStockItem InwardStockItem_inwardStockId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InwardStockItem"
    ADD CONSTRAINT "InwardStockItem_inwardStockId_fkey" FOREIGN KEY ("inwardStockId") REFERENCES public."InwardStock"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: InwardStockItem InwardStockItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InwardStockItem"
    ADD CONSTRAINT "InwardStockItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InwardStock InwardStock_supplierId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InwardStock"
    ADD CONSTRAINT "InwardStock_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES public."Supplier"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InwardStock InwardStock_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InwardStock"
    ADD CONSTRAINT "InwardStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LRTracking LRTracking_transportChallanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LRTracking"
    ADD CONSTRAINT "LRTracking_transportChallanId_fkey" FOREIGN KEY ("transportChallanId") REFERENCES public."TransportChallan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Lead Lead_assignedMrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_assignedMrId_fkey" FOREIGN KEY ("assignedMrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LeaveRequest LeaveRequest_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ledger Ledger_retailerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ledger"
    ADD CONSTRAINT "Ledger_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES public."Retailer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MR MR_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MR"
    ADD CONSTRAINT "MR_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MeetingChemist MeetingChemist_chemistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingChemist"
    ADD CONSTRAINT "MeetingChemist_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES public."Chemist"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeetingChemist MeetingChemist_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingChemist"
    ADD CONSTRAINT "MeetingChemist_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeetingDoctor MeetingDoctor_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingDoctor"
    ADD CONSTRAINT "MeetingDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeetingDoctor MeetingDoctor_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingDoctor"
    ADD CONSTRAINT "MeetingDoctor_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeetingHospital MeetingHospital_hospitalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingHospital"
    ADD CONSTRAINT "MeetingHospital_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES public."Hospital"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeetingHospital MeetingHospital_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingHospital"
    ADD CONSTRAINT "MeetingHospital_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeetingStockist MeetingStockist_meetingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingStockist"
    ADD CONSTRAINT "MeetingStockist_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES public."Meeting"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MeetingStockist MeetingStockist_stockistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MeetingStockist"
    ADD CONSTRAINT "MeetingStockist_stockistId_fkey" FOREIGN KEY ("stockistId") REFERENCES public."Stockist"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Meeting Meeting_chemistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES public."Chemist"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Meeting Meeting_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Meeting Meeting_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Meeting"
    ADD CONSTRAINT "Meeting_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Notification Notification_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OutwardStockItem OutwardStockItem_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutwardStockItem"
    ADD CONSTRAINT "OutwardStockItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OutwardStockItem OutwardStockItem_outwardStockId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutwardStockItem"
    ADD CONSTRAINT "OutwardStockItem_outwardStockId_fkey" FOREIGN KEY ("outwardStockId") REFERENCES public."OutwardStock"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OutwardStockItem OutwardStockItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutwardStockItem"
    ADD CONSTRAINT "OutwardStockItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OutwardStock OutwardStock_warehouseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutwardStock"
    ADD CONSTRAINT "OutwardStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES public."Warehouse"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PaymentCollection PaymentCollection_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PaymentCollection"
    ADD CONSTRAINT "PaymentCollection_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PricingMaster PricingMaster_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PricingMaster"
    ADD CONSTRAINT "PricingMaster_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PricingMaster PricingMaster_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PricingMaster"
    ADD CONSTRAINT "PricingMaster_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."ProductCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RetailerOrderItem RetailerOrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrderItem"
    ADD CONSTRAINT "RetailerOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RetailerOrderItem RetailerOrderItem_retailerOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrderItem"
    ADD CONSTRAINT "RetailerOrderItem_retailerOrderId_fkey" FOREIGN KEY ("retailerOrderId") REFERENCES public."RetailerOrder"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RetailerOrder RetailerOrder_chemistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrder"
    ADD CONSTRAINT "RetailerOrder_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES public."Chemist"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RetailerOrder RetailerOrder_hospitalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrder"
    ADD CONSTRAINT "RetailerOrder_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES public."Hospital"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RetailerOrder RetailerOrder_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrder"
    ADD CONSTRAINT "RetailerOrder_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RetailerOrder RetailerOrder_retailerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrder"
    ADD CONSTRAINT "RetailerOrder_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES public."Retailer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RetailerOrder RetailerOrder_stockistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RetailerOrder"
    ADD CONSTRAINT "RetailerOrder_stockistId_fkey" FOREIGN KEY ("stockistId") REFERENCES public."Stockist"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Retailer Retailer_stockistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Retailer"
    ADD CONSTRAINT "Retailer_stockistId_fkey" FOREIGN KEY ("stockistId") REFERENCES public."Stockist"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RolePermission RolePermission_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RolePermission RolePermission_featureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES public."Feature"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SchemeMaster SchemeMaster_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchemeMaster"
    ADD CONSTRAINT "SchemeMaster_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SchemeMaster SchemeMaster_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SchemeMaster"
    ADD CONSTRAINT "SchemeMaster_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: StockMovement StockMovement_inventoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES public."Inventory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Target Target_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Target"
    ADD CONSTRAINT "Target_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TourPlanChemist TourPlanChemist_chemistId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlanChemist"
    ADD CONSTRAINT "TourPlanChemist_chemistId_fkey" FOREIGN KEY ("chemistId") REFERENCES public."Chemist"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TourPlanChemist TourPlanChemist_tourPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlanChemist"
    ADD CONSTRAINT "TourPlanChemist_tourPlanId_fkey" FOREIGN KEY ("tourPlanId") REFERENCES public."TourPlan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TourPlanDoctor TourPlanDoctor_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlanDoctor"
    ADD CONSTRAINT "TourPlanDoctor_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TourPlanDoctor TourPlanDoctor_tourPlanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlanDoctor"
    ADD CONSTRAINT "TourPlanDoctor_tourPlanId_fkey" FOREIGN KEY ("tourPlanId") REFERENCES public."TourPlan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TourPlan TourPlan_mrId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TourPlan"
    ADD CONSTRAINT "TourPlan_mrId_fkey" FOREIGN KEY ("mrId") REFERENCES public."MR"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransportChallan TransportChallan_dispatchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TransportChallan"
    ADD CONSTRAINT "TransportChallan_dispatchId_fkey" FOREIGN KEY ("dispatchId") REFERENCES public."Dispatch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_branchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES public."Branch"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: WarehouseTransferItem WarehouseTransferItem_batchId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WarehouseTransferItem"
    ADD CONSTRAINT "WarehouseTransferItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES public."Batch"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WarehouseTransferItem WarehouseTransferItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WarehouseTransferItem"
    ADD CONSTRAINT "WarehouseTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WarehouseTransferItem WarehouseTransferItem_warehouseTransferId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."WarehouseTransferItem"
    ADD CONSTRAINT "WarehouseTransferItem_warehouseTransferId_fkey" FOREIGN KEY ("warehouseTransferId") REFERENCES public."WarehouseTransfer"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Warehouse Warehouse_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Warehouse"
    ADD CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict swi6FlIF9x6sbEEAwU9dpKcUdShYJuOsMtyrA2kRGPBT50EsLDgDchwp4clcTxZ

