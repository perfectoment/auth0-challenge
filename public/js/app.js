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
      try {

        const token = await auth0.getTokenSilently();

        const response = await fetch("/api/external", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const responseData = await response.json();

        const responseElement = document.getElementById("api-call-result");

        responseElement.innertext = JSON.stringify(responseData, {}, 2);

      } catch (e) {

        console.error(e);
      }
  };