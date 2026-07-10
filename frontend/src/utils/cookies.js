// import Cookies from 'universal-cookie';
// Create a new instance of Cookies
// const cookies = new Cookies();

// Function to set a cookie
const setCookies = (cookieData) => {
  if (Array.isArray(cookieData)) {
    // If an array of cookies is provided, set multiple cookies
    cookieData.forEach(({ name, value }) => {
      // cookies.set(name, value);
      sessionStorage.setItem(name, value);

    });
  } else {
    // If a single cookie object is provided, set a single cookie
    const { name, value } = cookieData;
    // cookies.set(name, value);
    sessionStorage.setItem(name, value);

  }
};


// example: setCookie({ name: 'exampleCookie', value: 'exampleValue' });

// Function to get a cookie by name
const getCookie = (name) => {
  // return cookies.get(name);
  return sessionStorage.getItem(name);
};

// example:  const cookieValue = getCookie('exampleCookie');

// Function to remove a cookie by name
const removeCookie = (name) => {
  // return cookies.remove(name, { path: '/' });
  return sessionStorage.removeItem(name);
};

const clearAllCookie = () => {
  // return cookies.remove(name, { path: '/' });
  return sessionStorage.clear();
};


// examples :removeCookie('exampleCookie');

export {
  setCookies,
  getCookie,
  removeCookie,
  clearAllCookie
};
