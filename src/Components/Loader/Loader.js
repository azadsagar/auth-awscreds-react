import { Component } from "react";
import "./loader.css";

class Loader extends Component {
    render(){
        return (
            <div className="lds-ripple">
                <div></div><div></div>
            </div>
        );
    }
}

export default Loader;