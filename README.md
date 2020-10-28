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
- Get employee tree: `X/employees/{company name}/tree`
   - Returns a JSON object containing a tree structure of the entire dataset
- Get all employees: `X/employees/{company name}/flat`
   - Returns all of the employees in the company

- Backend query: `X/employees/{company name}/query`
   - searches the db for employees matching the given query 
   - `body`: `{query: {...}}`
- Get currently authenticated user: `X/employees/{company name}/usr`
   - returns document of user corresponding to the passed auth token

### POST
- Import employees: `X/employees/import`
   - Imports employee data from uploaded JSON file into database
   - Data posted must be of type `multipart/form-data` with two fields:
       - `employeeJSON` = employee JSON file user uploads
       - `company` = name of company data belongs to

- Upload employee image: `X/employees/{company name}/upload-image`
  - Saves a profile image for an employee in the database
  - Data posted must be of type `multipart/form-data` with two fields:
     - `employeeImg` = the image file
     - `employeeId` = id of employee
   - To display employee image:
     - Convert `{employee object}.img.buffer.data` to a base64 string
     - Set img.src to `"data:image/png;base64," + {base64 image string}`

- Create new employee: `X/employees/{company name}/add`
   - Required body fields: `firstName`, `lastName`, `password`, `companyName`, `isManager`, `employeeId`, `managerId`, `email`
   - Other body fields: `companyId`, `positionTitle`, `startDate`
   - Adds a new employee for a company into the database

- Login: `X/auth/login/{ email: “emailstr”, password: “password” }`
   - Returns JSON web token valid for 2 hours

#### Manager Controls
- Update Employee: `X/employees/{company name}/update/{_id: employeeId, update: {fields to update}}`
- Remove Employee: `X/employees/{company name}/remove/{_id: employeeId}`
