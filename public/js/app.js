
let auth0 = null;

const fetchAuthConfig = () => fetch("/auth_config.json");

const configureClient = async () => {
    const response = await fetchAuthConfig();
    const config = await response.json();
  
    auth0 = await createAuth0Client({
      domain: config.domain,
      client_id: config.clientId,
      audience: config.audience
    });
  };

  
window.onload = async () => {
    await configureClient();

    updateUI();

    const isAuthenticated = await auth0.isAuthenticated();

    if (isAuthenticated) {

        return;
    }

  const query = window.location.search;
  if (query.includes("code=") && query.includes("state=")) {

    await auth0.handleRedirectCallback();

    updateUI();


    window.history.replaceState({}, document.title, "/");
  }

};

  const updateUI = async () => {
    const isAuthenticated = await auth0.isAuthenticated();
  
    document.getElementById("btn-logout").disabled = !isAuthenticated;
    document.getElementById("btn-login").disabled = isAuthenticated;
    document.getElementById("btn-call-api").disabled = !isAuthenticated;

    if (isAuthenticated) {
        document.getElementById("gated-content").classList.remove("hidden");

        document.getElementById(
            "ipt-access-token"
        ).innerHTML = await auth0.getTokenSilently();

        document.getElementById("ipt-user-profile").textContent = JSON.stringify(
            await auth0.getUser()
        );

    } else {
        document.getElementById("gated-content").classList.add("hidden");
    }
  };

  const login = async () => {
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin
    });
  };

  const logout = () => {
      auth0.logout({
          returnTo: window.location.origin
      });
  };


  const callApi = async () => {
    //defining user data JSON 
    const user = await auth0.getUser();
    console.log(user)
    //Validating if the email_validated = true
   if(user.email_verified){

    try {
  
      // Get the access token from the Auth0 client
      const token = await auth0.getTokenSilently();
      const pizza = await document.getElementById("pizzaType").value
      // Make the call to the API, setting the token
      // in the Authorization header

      //creating user metadata tag for pizza order storage
      const pizzaOrder = {user_metadata: {pizza: `${pizza}`}}
      //Turning pizza JSON format into a string to be parsed 
      const pizzaJSON = await JSON.stringify(pizzaOrder)
    
      const response = await fetch("/api/external", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      //Creating PATCH API call using the token header
      const order = await fetch(`/api/v2/users/${user.sub}`, {
        method:'PATCH',  
        headers: {
            Authorization: `Bearer ${token}`
          },
        body: pizzaJSON
         
      });
  
      // Fetch the JSON result
      const responseData = await response.json();
  
      // Display the result in the order output element
      const orderData = await order.json()

      const responseOrder = document.getElementById("userUpdate")

      responseOrder.innerText = JSON.stringify(orderData, {}, 2)

       // Display the result in the output element

      const responseElement = document.getElementById("api-call-result");
  
      responseElement.innerText = JSON.stringify(responseData, {}, 2);
  
  } catch (e) {
      // Display errors in the console
      console.error(e);
    }

} else {
        // Displaying result of non-validated email address
       const responseElement = document.getElementById("api-call-result");

       responseElement.innerText = "Please verify your email address"

    }
  };


  