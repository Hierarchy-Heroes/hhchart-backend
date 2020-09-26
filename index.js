const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://Administrator:vsMqmkw2oR2c5KtJ@cluster0.o4mys.mongodb.net/CycloneAviation?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function run() {

    try {
        // Connect to the MongoDB cluster
        await client.connect();
        await findByFirstName(client, "Silvia");
 
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

}

run().catch(console.dir);


/**
* Searches the CustomerJSON's document to find an employee with the given first name and prints out the Employee object.
*/
async function findByFirstName(client, name){

    const collection = client.db("CycloneAviation").collection("CustomerJSONs");

    collection.findOne({firstName: name}, function(err, item) {
        console.log(item);
    });
};