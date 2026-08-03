# SOFTWARE REQUIREMENTS SPECIFICATION

## CMS Role and Permission Matrix

**Module ID:** CMS-RBAC  
**Version:** 1.0  
**Scope:** Affiliate Platform Admin CMS

---

# I. Introduction

## 1. Purpose

Tài liệu định nghĩa bốn System Role và ma trận phân quyền theo năm menu chính của Admin CMS. Đây là permission catalog trung tâm để UI, API và các SRS nghiệp vụ sử dụng thống nhất.

## 2. Scope

CMS Permission Matrix gồm:

- 5 module tương ứng menu CMS: Dashboard, Category Management, Brand Management, Transaction Management và Exception Management.
- 4 System Role: Admin CMS, Finance CMS, CSKH CMS và Operation CMS.
- 5 action: View, Create, Edit, Export và Retry.
- Quy tắc enforce quyền của CMS User tại UI/API. Việc tạo CMS User và gán Role thuộc quy trình system provisioning ngoài phạm vi màn hình CMS hiện tại.

## 3. Related Documents

- `category-management-module-04-template.md`
- `brand-offer-management-module-04-template.md`
- `order-transaction-management-module-04-template.md`
- `reporting-reconciliation-module-04-template.md`
- `audit-log-module-04-template.md`

---

# II. Overall Description

## 1. Actors

| System Role | Role code | Description |
|---|---|---|
| Admin CMS | `CMS_ADMIN` | Quản trị cao nhất trong phạm vi năm module CMS. |
| Finance CMS | `CMS_FINANCE` | Xem Dashboard và Transaction; export Transaction phục vụ tài chính/đối soát. Không truy cập Exception. |
| CSKH CMS | `CMS_CSKH` | Chỉ xem Dashboard, Category và Brand; không truy cập Transaction/Exception, COnfiguration và không thực hiện thao tác ghi. |
| Operation CMS | `CMS_OPERATION` | Vận hành Category, Brand và Transaction. Không truy cập Exception. |

## 2. Module Scope

| Module code | CMS menu | Functions covered |
|---|---|---|
| `DASHBOARD` | Dashboard | Metric, biểu đồ và báo cáo tổng quan CMS. |
| `CATEGORIES` | Category Management | Danh sách, tạo và chỉnh sửa Affiliate Category. |
| `BRANDS` | Brand Management | Brand, Offer, mapping, Category commission, Tenant assignment, Tenant Share configuration và Brand integration trong Brand context. |
| `TRANSACTIONS` | Transaction Management | Danh sách, chi tiết Transaction và export dữ liệu Transaction. |
| `EXCEPTIONS` | Exception Management | Danh sách, chi tiết, export và retry Exception. |

Các chức năng con có thể được trình bày bằng tab/màn hình bên trong menu cha nhưng vẫn sử dụng permission của module cha, trừ khi Product bổ sung permission chi tiết trong phiên bản sau.

## 3. Authorization Model

Permission code có cấu trúc:

`<module_code>.<action_code>`

Ví dụ:

- `dashboard.view`
- `categories.create`
- `brands.edit`
- `transactions.export`
- `exceptions.retry`

Backend phải authorize bằng permission code thực tế; không authorize chỉ bằng tên Role, trạng thái checkbox hoặc flag `Full`.

---

# III. Use Case List

| # | UC ID | Use Case | Actor | Priority |
|---:|---|---|---|---|
| 1 | CMS-RBAC-001 | Xem Permission Matrix theo System Role | Admin CMS | Must |
| 2 | CMS-RBAC-002 | Enforce permission trên CMS | CMS User/Permission Service | Must |

---

# IV. Permission Action Matrix

## 1. Permission Action Catalog

| CMS Module | View | Create | Edit | Export | Retry | Full covers |
|---|:---:|:---:|:---:|:---:|:---:|---|
| Dashboard | ✓ | — | — | — | — | View |
| Category Management | ✓ | ✓ | ✓ | — | — | View + Create + Edit |
| Brand Management | ✓ | ✓ | ✓ | — | — | View + Create + Edit |
| Transaction Management | ✓ | — | — | ✓ | — | View + Export |
| Exception Management | ✓ | — | — | ✓ | ✓ | View + Export + Retry |
| Configuration | ✓ | — | — | ✓ | ✓ | Create + Edit + Delete |

Quy ước:

- `✓`: action tồn tại và có thể cấp cho Role.
- `—`: action không áp dụng; UI không hiển thị checkbox và backend từ chối nếu client gửi.
- `Full`: thông tin tổng hợp chỉ đọc, cho biết Role có tất cả action khả dụng của module; không phải permission độc lập hoặc checkbox cho người dùng chỉnh sửa.

## 2. Default System Role Permission Matrix

| CMS Module | Admin CMS | Finance CMS | CSKH CMS | Operation CMS |
|---|---|---|---|---|
| Dashboard | View | View | __ | View |
| Category Management | View, Create, Edit | __View__ | __ | View, Create, Edit |
| Brand Management | View, Create, Edit | View | __ | View, Create, Edit |
| Transaction Management | View, Export | View, Export | View | View, Export |
| Exception Management | View, Export, Retry | — | — | — |
| Configuration | View, Create, Edit, Delete | — | — | — |
## 3. Role Scope

### Admin CMS

- Có toàn bộ action hợp lệ của năm module.
- Permission Matrix của bốn System Role là cấu hình chuẩn của hệ thống và chỉ hiển thị read-only.

### Finance CMS

- Xem Dashboard, Category và Brand để có context đối soát.
- Xem/export Transaction.
- Không truy cập Exception Management, Configuration.
- Không Create/Edit Category hoặc Brand.
- Không Retry Exception.

### CSKH CMS

- Chỉ có View trên Transaction Management.
- Không truy cập Dashboard, Category Management, Brand Management, Transaction Management, Configuration hoặc Exception Management.
- Không Create, Edit, Export hoặc Retry.
- Field tài chính nhạy cảm còn chịu Financial Data Scope.

### Operation CMS

- Xem Dashboard.
- Xem/Create/Edit Category Management.
- Xem/Create/Edit Brand Management.
- Xem/Export Transaction.
- Không truy cập Exception Management, Configuration.
- Không cấu hình Permission.

## 4. Financial Data Scope

| Financial information | Admin CMS | Finance CMS | CSKH CMS | Operation CMS |
|---|:---:|:---:|:---:|:---:|
| Gross commission Brand → Platform | ✓ | ✓ | — | ✓ |
| Tenant Share | ✓ | ✓ | — | ✓ |
| Affiliate keep | ✓ | ✓ | — | — |
| Export Transaction financial data | ✓ | ✓ | — | Theo field scope, không gồm Affiliate keep |
| Xem/Export/Retry Exception | ✓ | — | — | — |
| Chỉnh Category/Offer commission hoặc Tenant Share rule | ✓ | — | — | ✓ trong Brand Management |

Nếu cần enforce độc lập với module permission, hệ thống sử dụng thêm các permission code:

- `financial.gross_commission.view`
- `financial.tenant_share.view`
- `financial.affiliate_keep.view`
- `financial.rules.edit`

---

# V. Logic Description

## 1. Authorization Sequence

Mọi request CMS phải được kiểm tra theo đúng thứ tự:

1. Xác thực session/token còn hiệu lực.
2. Kiểm tra CMS User tồn tại và đang `Active`.
3. Lấy System Role hiệu lực từ dữ liệu provisioning.
4. Kiểm tra System Role hợp lệ và đang `Active`.
5. Tải permission đã được system seed theo Role.
6. Kiểm tra quyền `View` của module.
7. Nếu request thực hiện action, kiểm tra thêm quyền Create/Edit/Export/Retry tương ứng.
8. Lọc field tài chính theo Financial Data Scope trước khi trả response hoặc tạo file export.

Nếu một bước không đạt, hệ thống dừng xử lý và không tiếp tục query/thay đổi dữ liệu nghiệp vụ.

## 2. Load CMS Menu

| Condition | UI behavior | API behavior |
|---|---|---|
| Có `<module>.view` | Hiển thị menu và cho phép mở list/detail. | Cho phép gọi read API trong phạm vi dữ liệu tương ứng. |
| Không có `<module>.view` | Ẩn menu; không render link/action dẫn đến module. | Trả `403 Forbidden` hoặc Not found theo security policy; không trả dữ liệu module. |
| Session hết hạn/User Inactive/Role không hợp lệ | Không tải CMS menu và chuyển về đăng nhập hoặc trang Access denied. | Trả `401/403`; không trả permission hoặc dữ liệu nghiệp vụ. |

Giới hạn theo Role:

- Admin CMS: thấy đủ năm menu.
- Finance CMS: thấy Dashboard, Category Management, Brand Management và Transaction Management; không thấy Exception.
- CSKH CMS: chỉ thấy Dashboard, Category Management và Brand Management.
- Operation CMS: thấy Dashboard, Category Management, Brand Management và Transaction Management; không thấy Exception.

## 3. Execute Action

| UI action | Required permission | Additional rule |
|---|---|---|
| Mở Dashboard | `dashboard.view` | Dữ liệu tài chính tiếp tục lọc theo Financial Data Scope. |
| Mở Category list/detail | `categories.view` | Không có View thì UI/API đều bị chặn. |
| Create Category | `categories.view` + `categories.create` | Chỉ Admin CMS và Operation CMS theo matrix hiện tại. |
| Edit Category | `categories.view` + `categories.edit` | Chỉ Admin CMS và Operation CMS theo matrix hiện tại. |
| Mở Brand/Offer/mapping/rule | `brands.view` | Áp dụng chung cho chức năng con trong Brand Management. |
| Create Brand/Offer/mapping/rule | `brands.view` + `brands.create` | Chỉ Admin CMS và Operation CMS theo matrix hiện tại. |
| Edit Brand/Offer/mapping/rule | `brands.view` + `brands.edit` | Field commission/Tenant Share còn yêu cầu financial rule scope hợp lệ. |
| Mở Transaction list/detail | `transactions.view` | CSKH CMS không có quyền; không được tải dữ liệu bằng direct URL/API. |
| Export Transaction | `transactions.view` + `transactions.export` | File chỉ chứa field được phép theo Financial Data Scope. |
| Mở Exception list/detail | `exceptions.view` | Chỉ Admin CMS có quyền theo matrix hiện tại. |
| Export Exception | `exceptions.view` + `exceptions.export` | Chỉ Admin CMS; file không chứa credential, secret hoặc raw payload ngoài policy. |
| Retry Exception | `exceptions.view` + `exceptions.retry` | Chỉ Admin CMS; backend phải validate lại trạng thái Exception và điều kiện retry. |

## 4. Financial Field Filtering

Sau khi module/action permission hợp lệ, backend tiếp tục lọc field:

- Admin CMS: xem đầy đủ Gross commission, Tenant Share và Affiliate keep.
- Finance CMS: xem Gross commission, Tenant Share và Affiliate keep trên Dashboard/Transaction trong phạm vi quyền.
- Operation CMS: xem Gross commission và Tenant Share; không trả Affiliate keep.
- CSKH CMS: không trả Gross commission, Tenant Share, Affiliate keep hoặc field tài chính bị hạn chế.
- Field bị cấm phải được loại khỏi API response/export, không chỉ ẩn bằng CSS.

## 5. View Permission Matrix

- Permission Matrix của bốn System Role là read-only.
- Chỉ Admin CMS được mở màn hình/section ma trận.
- Finance CMS, CSKH CMS và Operation CMS không được mở direct URL/API của Permission Matrix.
- Không có Save Permission, Create Role, Edit Role hoặc gán Role trên CMS.
- Role/permission baseline chỉ thay đổi qua system seed/migration có kiểm soát.

## 6. Role Changed by Provisioning

1. Provisioning cập nhật CMS User Role Assignment và ghi Audit Log.
2. Hệ thống thu hồi hoặc làm mới session/token cũ.
3. Ở request tiếp theo, Permission Service tải Role và permission mới.
4. Menu/action/financial field được tính lại theo Role mới.
5. Cache permission cũ phải bị vô hiệu hóa; không duy trì quyền của Role trước đó.

---

# VI. Business Rules

| BR ID | Rule |
|---|---|
| BR-CMS-RBAC-001 | CMS chỉ có bốn System Role: Admin CMS, Finance CMS, CSKH CMS và Operation CMS. |
| BR-CMS-RBAC-002 | Permission Matrix chỉ gồm năm module: Dashboard, Category Management, Brand Management, Transaction Management và Exception Management. |
| BR-CMS-RBAC-003 | Action catalog chỉ gồm View, Create, Edit, Export và Retry. |
| BR-CMS-RBAC-004 | Backend phải enforce permission tại API/service/repository; ẩn hoặc disable UI không thay thế authorization. |
| BR-CMS-RBAC-005 | View là điều kiện bắt buộc để mở module và là điều kiện bổ sung cho Export/Retry. |
| BR-CMS-RBAC-006 | Export Transaction yêu cầu `transactions.view` + `transactions.export`; Export Exception yêu cầu `exceptions.view` + `exceptions.export`. |
| BR-CMS-RBAC-007 | Retry Exception yêu cầu `exceptions.view` + `exceptions.retry`. |
| BR-CMS-RBAC-008 | Permission Matrix của bốn System Role là cấu hình chuẩn, chỉ đọc trên CMS và không cho người dùng thay đổi. |
| BR-CMS-RBAC-009 | `Full` là trạng thái dẫn xuất theo module, không persist hoặc authorize như permission riêng. |
| BR-CMS-RBAC-010 | Hệ thống provisioning phải luôn duy trì ít nhất một CMS User Active có Admin CMS Role. |
| BR-CMS-RBAC-011 | CMS User Role assignment là dữ liệu chỉ đọc trên CMS; việc tạo/thay đổi assignment chỉ được thực hiện bởi quy trình system provisioning có kiểm soát và phải ghi Audit Log. |
| BR-CMS-RBAC-012 | Khi provisioning thay Role, hệ thống phải làm mới/thu hồi session cũ theo security policy. |
| BR-CMS-RBAC-013 | Khi khởi tạo CMS, hệ thống seed đúng bốn System Role và permission theo Default System Role Permission Matrix. Bốn Role luôn Active, không được đổi role code, xóa, Inactive hoặc sửa permission qua CMS/API. |
| BR-CMS-RBAC-014 | CSKH CMS không được Export/Retry hoặc nhận financial field bị giới hạn dù có quyền View module. |
| BR-CMS-RBAC-015 | Function bên trong Brand Management dùng quyền module Brand: Brand, Offer, mapping, commission, Tenant assignment, Tenant Share và integration. |
| BR-CMS-RBAC-016 | Permission code trong các SRS module phải tham chiếu catalog này, không tạo alias khác nghĩa cho cùng action. |
| BR-CMS-RBAC-017 | Exception Management chỉ cấp cho Admin CMS. Finance CMS, CSKH CMS và Operation CMS không được thấy menu hoặc truy cập API Exception. |
| BR-CMS-RBAC-018 | CSKH CMS chỉ có View trên Dashboard, Category Management và Brand Management; không được truy cập Transaction Management hoặc Exception Management. |

---

# VII. Data Requirements

## 1. CMS System Role

| Field | Type | R/O | Description |
|---|---|---|---|
| role_id | UUID/String | R | ID duy nhất của Role. |
| role_code | Enum | R | `CMS_ADMIN`, `CMS_FINANCE`, `CMS_CSKH`, `CMS_OPERATION`. |
| role_name | Text | R | Tên hiển thị tương ứng. |
| status | Enum | R | Luôn `Active` với bốn System Role; CMS User không được chuyển Inactive. |
| seed_version | Text | R | Phiên bản permission baseline được đóng gói cùng deployment/migration; không phải optimistic concurrency từ UI. |
| seeded_at | Datetime | R | Thời điểm system seed/migration gần nhất. |

Unique: `role_code`. Hệ thống không cho tạo thêm Role code, đổi code hoặc xóa bốn System Role.

## 2. CMS Permission Catalog

| Field | Type | R/O | Description |
|---|---|---|---|
| permission_id | UUID/String | R | ID Permission. |
| module_code | Enum | R | `DASHBOARD`, `CATEGORIES`, `BRANDS`, `TRANSACTIONS`, `EXCEPTIONS`. |
| action_code | Enum | R | `VIEW`, `CREATE`, `EDIT`, `EXPORT`, `RETRY`. |
| permission_code | Text | R | Canonical code `<module>.<action>`. |
| is_applicable | Boolean | D | Xác định từ Permission Action Catalog; false tương ứng ô `—`. |
| status | Enum | R | `Active`, `Inactive`. |

Không tồn tại `DELETE`, `DISABLE` hoặc `DELETE_DISABLE` trong catalog.

## 3. CMS Role Permission

| Field | Type | R/O | Description |
|---|---|---|---|
| role_permission_id | UUID/String | R | ID relation. |
| role_id | Ref | R | System Role nhận quyền. |
| permission_id | Ref | R | Permission Active và applicable. |
| is_granted | Boolean | R | Giá trị được seed theo Default System Role Permission Matrix; CMS UI/API chỉ đọc. |
| seed_version | Text | R | Phiên bản baseline đã tạo relation; không phải concurrency version từ UI. |
| seeded_at | Datetime | R | Thời điểm system seed/migration tạo hoặc đồng bộ relation. |

Unique: `role_id + permission_id`.

## 4. CMS User Role Assignment — Provisioning Read-only

| Field | Type | R/O | Description |
|---|---|---|---|
| assignment_id | UUID/String | R | ID relation. |
| cms_user_id | Ref | R | CMS User được gán Role. |
| role_id | Ref | R | Một trong bốn System Role. |
| effective_from | Datetime | R | Thời điểm Role có hiệu lực. |
| effective_to | Datetime | O | Null khi còn hiệu lực. |
| assigned_by/assigned_at | Ref/Datetime | R | Metadata gán Role. |

MVP1: một CMS User có đúng một System Role hiệu lực tại một thời điểm. Entity này chỉ được đọc để authorization; Admin CMS không có menu/action/API gán Role. Việc tạo hoặc thay đổi assignment thuộc system provisioning ngoài phạm vi UC của tài liệu.

---

# VIII. Acceptance Criteria

| AC ID | Criteria |
|---|---|
| AC-CMS-RBAC-001 | Hệ thống có đúng bốn Role code: `CMS_ADMIN`, `CMS_FINANCE`, `CMS_CSKH`, `CMS_OPERATION`. |
| AC-CMS-RBAC-002 | Permission Matrix hiển thị đúng 6 module. |
| AC-CMS-RBAC-003 | Admin CMS có toàn bộ action hợp lệ của 6 module; Permission Matrix hiển thị read-only và không cho chỉnh sửa. |
| AC-CMS-RBAC-004 | Finance CMS xem/export Transaction nhưng không truy cập Exception hoặc Create/Edit Category/Brand. |
| AC-CMS-RBAC-005 | CSKH CMS chỉ xem Dashboard, Category và Brand; không thấy menu và không gọi được API Transaction/Exception. |
| AC-CMS-RBAC-006 | Operation CMS View/Create/Edit Category và Brand, View/Export Transaction; không thấy menu và không gọi được API Exception. |
| AC-CMS-RBAC-007 | User thiếu View không thể mở menu/list/detail bằng UI hoặc gọi API trực tiếp. |
| AC-CMS-RBAC-008 | User thiếu Export không thể export; user thiếu Retry không thể retry Exception. |
| AC-CMS-RBAC-009 | Full được tính đúng từ action khả dụng và không được lưu như permission độc lập. |
| AC-CMS-RBAC-010 | CMS UI/API không cung cấp thao tác gán hoặc thay Role; assignment chỉ được đọc từ dữ liệu provisioning. |
| AC-CMS-RBAC-011 | API từ chối permission code/action không tồn tại trong catalog hoặc action không áp dụng cho module. |
| AC-CMS-RBAC-012 | Quy trình provisioning ngăn thay đổi làm không còn CMS User Active mang Role Admin CMS. |
| AC-CMS-RBAC-013 | CSKH không nhận financial field bị hạn chế trong UI, API hoặc export. |
| AC-CMS-RBAC-014 | Khi provisioning thay Role, quyền mới được áp dụng và session cũ được xử lý theo security policy. |
| AC-CMS-RBAC-015 | Khi khởi tạo CMS, hệ thống seed đúng permission của bốn System Role; các Role luôn Active và Permission Matrix chỉ đọc. |
| AC-CMS-RBAC-016 | UI và API đều từ chối đổi role code, xóa, Inactive hoặc sửa permission của System Role. |
