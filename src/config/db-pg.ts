import { Pool, Client } from "pg";

import pgPromise from "pg-promise";
//postgres
export const connectionString = process.env.DBENTRADAS || "";

const pgp = pgPromise({}); // empty pgPromise instance

export const psql = pgp(connectionString); // get connection to your PG db instance

// clients will also use environment variables
// for connection information
export const client = new Client({
  connectionString: connectionString,
});
client.connect();
client.query("SELECT NOW()", (err, res) => {
  // console.log(err, res);
  client.end();
});
