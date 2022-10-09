import { Component } from "react";
import Loader from "./Components/Loader/Loader";
import Aux from "./Components/Aux/Aux";
import Amplify,{Auth,Hub} from "aws-amplify";
import awsconfig from "./awsconfig";
import axios from "axios";
import "./App.css";
//import done from "."
import okimg from "./all_done.webp";

//console.log(awsconfig);
Amplify.configure(awsconfig);

class App extends Component {

  state = {
    user : null,
    username: null,
    customState: null,
    appInitialised: false,
    publicKey: null,
    pageContent: null,
    timeout: 10
  };

  retrive_creds = async (public_key) => {

    const authSession = await Auth.currentSession();
    const jwtToken = authSession.getIdToken().jwtToken;

    const response = await axios({
      url: `https://${process.env.REACT_APP_API_APP_URL}/auth-creds`,
      method: "post",
      data: {
        public_key: public_key
      },
      headers: {
        Authorization: jwtToken
      }
    });

    if(response.data.success){
      return response.data;
    }
  }

  getPublicKey = async () => {

    const response = await axios.get(`http://${process.env.REACT_APP_CLI_APP_URL}/publickey`);
    if (response.data.success === true) {
      this.setState({
        publicKey: response.data.data
      });
      return response.data.data;
    }

    throw Error("Unable to retrive public key");
    
  }

  setcreds = async (data) => {
    const response = await axios({
      url: `http://${process.env.REACT_APP_CLI_APP_URL}/setcreds`,
      method: "post",
      data : {...data,username: this.state.username}
    });
    console.log(response);
  }

  spinWheel = async () => {
    try {
      if(this.state.publicKey !== null)
        return;
      
      const public_key = await this.getPublicKey();
      const encryptedCreds = await this.retrive_creds(public_key);
      console.log(encryptedCreds);
      let pageContent = (
        <Aux>
          <Loader />
          <p className="pbold">
            Authenticated as {this.state.username}
          </p>
          <p>Almost there...</p>
        </Aux>
      );
      this.setState({
        pageContent: pageContent
      });


      await this.setcreds(encryptedCreds);

      pageContent = (
        <Aux>
          <img src={okimg} style={{width: "150px"}} alt="Ok" />
          <p className="pbold">
            Authenticated as {this.state.username}
          </p>
          <p>Done !, You may close this window.</p>
        </Aux>
      );
      this.setState({
        pageContent: pageContent
      });
      
      
    } catch (error) {
      console.log(error);
    }
  }

  initApp = () => {
    Hub.listen("auth", ({payload: {event,data}})=>{
      switch(event) {
        case 'signIn':
          console.log("sign in");
          this.setState({ user: data });
          break;
        case 'signOut':
          this.setState({ user: null });
          break;
        case "customOAuthState":
          console.log("oauth signin");
          this.setState({ customState: data });
          break;
        default:
          console.log(event);
      }
    });

    Auth.currentAuthenticatedUser()
    .then(user => {
      this.setState({
        user: user,
        appInitialised: true
      });
      console.log("user signed in !");
      return Auth.currentSession()
    })
    .then(data =>{
      let idToken=data.getIdToken();
      let email = idToken.payload.email;

      const pageContent = (
        <Aux>
          <Loader />
          <p className="pbold">
            Authenticated as {email}
          </p>
          <p>Retriving Credentials...</p>
        </Aux>
      );

      this.setState({
        username: email,
        pageContent: pageContent
      });

      if(this.state.publicKey === null)
        this.spinWheel();
    })
    .catch(error => {
      console.error(error);
      this.setState({
        appInitialised: true
      });
    });

    //Auth.signOut();
  };

  

  componentDidMount(){

    const pageContent=(
      <Aux>
        <Loader />
        <p className="pbold">Authenticating User...</p>
      </Aux>
    );

    this.setState({
      pageContent: pageContent
    });

    this.initApp();
    console.log("Component Did mount");

  }

  render(){
    return (
      <div className="centerdiv">
        {
          this.state.appInitialised ?
            this.state.user === null ? Auth.federatedSignIn({provider: 'Google'}) : 
            <Aux>
              {this.state.pageContent}
            </Aux>
          : 
          <Loader/>
        }
      </div>
    )
  }
}

export default App;