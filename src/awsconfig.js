const awsconfig = {
    Auth : {
        identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
        region : process.env.REACT_APP_COGNITO_REGION,
        identityPoolRegion: process.env.REACT_APP_COGNITO_REGION,
        userPoolId : process.env.REACT_APP_COGNITO_USER_POOL_ID,
        userPoolWebClientId : process.env.REACT_APP_CLIENT_ID,
        cookieStorage : {
            domain : process.env.REACT_APP_DOMAIN_NAME, //this is very important
            secure: true
        },
        oauth: {
            domain : `${process.env.REACT_APP_COGNTIO_DOMAIN_NAME}.auth.${process.env.REACT_APP_COGNITO_REGION}.amazoncognito.com`,
            scope : ["profile","email","openid"],
            redirectSignIn: `https://${process.env.REACT_APP_DOMAIN_NAME}`,
            redirectSignOut: `https://${process.env.REACT_APP_DOMAIN_NAME}`,
            responseType : "token"
        }
    }
};
export default awsconfig;