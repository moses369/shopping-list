import express from "express";
import dotenv from "dotenv";
import sql from "../database/db.js";
import sendNodeReq from "../nodeFetch.js";

dotenv.config();
const { NODE_ENV } = process.env;
const devLog = (obj) => (NODE_ENV !== "production" ? console.log(obj) : null);

const products = express.Router();
/***************  ROUTES TO BASE URL ***************/
products
  .route("/")
  .get(async (req, res, next) => {
    try {
      const data = await sendNodeReq(req, next);
      
      res.json(data);
    } catch (err) {
      next(err);
    }
  });
 
products.route("/:id").delete(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usedFor } = req.body;
    const ID = parseInt(id);
    if (isNaN(ID)) {
      next();
    } else {
      const item = await sql`SELECT * FROM ${sql(usedFor)} WHERE id = ${id}`;
      if (item) {
        const deleted = await sql`DELETE FROM ${sql(
          usedFor
        )} WHERE id = ${id} RETURNING *`;
        devLog({ deleted: deleted[0], From: usedFor });
        res.status(204).send("Item Deleted");
      } else {
        next();
      }
    }
  } catch (err) {
    next(err);
  }
});
/***************  END ROUTES TO BASE URL ***************/


/*************** ROUTE TO ITEM IN A TABLE ***************/
products.route("/table").get(async (req, res, next) => {
  try {
    const { user_id, usedfor } = req.headers;
    
    const item = await sql`SELECT * FROM ${sql(
      usedfor
      )} WHERE user_id=${user_id}`;
      if (item) {
      devLog({ usedfor,retreved:item });
    
      res.status(200).json(item);
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
});
products.route("/table/:id").patch(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usedFor, user_id, ...update } = req.body;

    const ID = parseInt(id);
    if (isNaN(ID)) {
      next();
    } else {
      const item = await sql`SELECT * FROM ${sql(
        usedFor
      )} WHERE product_id = ${id} AND user_id=${user_id}`;
      if (item) {
        const updated = (await sql`UPDATE ${sql(usedFor)} SET ${sql(
          update
        )}WHERE product_id = ${id} AND user_id=${user_id} RETURNING ${sql(update)},product_id`)[0];
        devLog({ usedFor, updated });

        res.status(200).json(updated);
      } else {
        next();
      }
    }
  } catch (error) {
    next(error);
  }
});
/*************** END ROUTE TO ITEM IN A TABLE ***************/



products.use((req, res, next) => next());
export default products;
