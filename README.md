# Set Up

### Install dependencies

Navigate to project and install dependencies with npm:

`npm install`

### Connect to MongoDB Cluster

[Add your IP address to MongoDB Atlas](https://docs.atlas.mongodb.com/security/ip-access-list/#add-ip-access-list-entries).
You will only be able to connect to the cluster from the IP addresses added to the account.

### Run application
 `npm start`

 Listen to the server at `localhost:3000`

# Endpoints

`X = localhost:port`
`{} = http body`

Note: all endpoints require authentication header

### GET
- Get employee tree: `X/employees/tree`
   - Returns a JSON object containing a tree structure of the entire dataset
- Get all employees: `X/employees/flat`
   - Returns all of the employees in the company

- Backend query: `X/employees/query`
   - searches the db for employees matching the given query
   - `body`: `{query: {...}}`
- Get currently authenticated user: `X/employees/usr`
   - returns document of user corresponding to the passed auth token

#### Manager Controls
- Get all transfer requests that need to be approved by logged in employee (should be a manager): `X/employees/transfer-requests`

### POST
- Import employees: `X/employees/import`
   - Imports employee data from uploaded JSON file into database
   - Create a sub-directory called `uploads` where the files can be stored
   - Data posted must be of type `multipart/form-data` with two fields:
       - `employeeJSON` = employee JSON file user uploads

- Upload employee image: `X/employees/upload-image`
  - Saves a profile image for an employee in the database
  - Data posted must be of type `multipart/form-data` with two fields:
     - `employeeImg` = the image file
     - `_id` = id of employee
   - To display employee image:
     - Convert `{employee object}.img.buffer.data` to a base64 string
     - Set img.src to `"data:image/png;base64," + {base64 image string}`

- Create new employee: `X/employees/add`
   - Required body fields: `firstName`, `lastName`, `password`, `companyName`, `isManager`, `employeeId`, `managerId`, `email`
   - Other body fields: `companyId`, `positionTitle`, `startDate`
   - Adds a new employee for a company into the database

- Login: `X/auth/login/{ email: “emailstr”, password: “password” }`
   - Returns JSON web token valid for 2 hours

#### Manager Controls
- Update Employee: `X/employees/update/{_id: employeeId, update: {fields to update}}`
- Remove Employee: `X/employees/remove/{_id: employeeId}`
- Create Transfer Request: `X/employees/transfer-request/`
  - Manager makes a request to transfer employee to a different manager
  - Required body fields:
    - `newManagerId`: id of new manager
    - `employeeId`: id of employee to transfer
  - Optional body field:
    - `transferType`: either `individual` (transfer just the employee, assign direct reports to old manager) or `team` (transfer entire subtree)
- Approve/Deny Transfer: `X/employees/transfer/{requestId: "id of request", approved: <boolean>}`
  - New manager approves/denies request to transfer employee
