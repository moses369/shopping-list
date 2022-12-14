import fetch from "node-fetch";
import url from "node:url";
import btoa from "btoa";
import dotenv from "dotenv";
dotenv.config();

const { API_CLIENT_USER, API_CLIENT_SECRET, API_BASE_URL, NODE_ENV } =
  process.env;
  const devLog = (obj) => NODE_ENV !== "production" ? console.log(obj):null;

const token = async () => {
  try {
    const tokenHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${API_CLIENT_USER}:${API_CLIENT_SECRET}`)}`,
    };
    const res = await fetch("https://api.kroger.com/v1/connect/oauth2/token", {
      method: "POST",
      headers: tokenHeaders,
      body: "grant_type=client_credentials&scope=product.compact",
    });
    const token = await res.json();

    return token;
  } catch (err) {
    console.error(err);
  }
}

const sendNodeReq = async (req, next, id = "") => {
  try {
    const {pagination} = req.headers
    const params = new URLSearchParams({
      ...url.parse(req.url, true).query,
    });
    const { token_type, access_token } = await token();
    const options = {
      method: "GET",
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    };
    const apiRes = await fetch(
      `${API_BASE_URL}${id}?${params}&filter.locationId=01400376`,
      options
    );
    if (apiRes.status >= 200 && apiRes.status < 300) {
      const data = await apiRes.json();
      devLog({APIquery:req.url,meta:data.meta})
      return pagination ? {data,meta:data.meta}:data
    } else {
      const body = await apiRes.json();
      devLog({STATUS_CODE:apiRes.status, RESPONSE: body});
      
      return apiRes
    }
  } catch (error) {
    next(error);
  }
};
export default sendNodeReq;
