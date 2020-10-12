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

### GET
- Get employee tree: `X/employees/{company name}/tree`
   - Returns a JSON object containing a tree structure of the entire dataset
- Get all employees: `X/employees/{company name}/flat`
   - Returns all of the employees in the company

### POST
- Import employees: `X/employees/import`
   - Imports employee data from uploaded JSON file into database
   - Data posted must be of type `multipart/form-data` with two fields:
       - `employeeJSON` = employee JSON file user uploads
       - `company` = name of company data belongs to


- Create new employee: `X/employees`
   - Required body fields: `firstName`, `lastName`, `password`, `companyName`, `isManager`, `employeeId`, `managerId`, `email`
   - Other body fields: `companyId`, `positionTitle`, `startDate`
   - Adds a new employee for a company into the database

- Login: `X/auth/login/{ email: “emailstr”, password: “password” }`
   - Returns JSON web token valid for 2 hours
