const backDomin = "http://localhost:8080";

const backApis = {
  register: { url: `${backDomin}/api/register`, method: "POST" },
  login: { url: `${backDomin}/api/login`, method: "POST" },
  getUserInfo: { url: `${backDomin}/api/user-details`, method: "GET" },
  logOut: { url: `${backDomin}/api/logout`, method: "GET" },
  // !Panel Admin
  allUsers : {url: `${backDomin}/api/all-users`, method: "GET"},
};

export default backApis;
