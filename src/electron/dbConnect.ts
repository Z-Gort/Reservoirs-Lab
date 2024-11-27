import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "password",
  database: "postgres"
});

client.connect();

client.query(`SELECT * FROM embeddings`, (err: Error | null, res: { rows: any[] } | null) => {
  if (!err) {
    console.log(res!.rows);
  } else {
    console.log(err.message);
  }
  client.end();
});
