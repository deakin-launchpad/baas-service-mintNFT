# Baas-service-mintnft

This is a very simple Node Hapi / Swagger application that uses Express and serves a web server. This application is meant to act as a service through which users can mint an NFT and pin it to IPFS.

To mint an NFT, you can either use the [baas-backend](https://github.com/deakin-launchpad/baas_backend) and [baas-frontend](https://github.com/deakin-launchpad/baas_dashboard) and connect to this service, or you can directly hit the API endpoint "/api/demo/mintNftIPFS" for this application which accepts a JSON body type in this format:
```
{
    jobID: String,
    datashopServerAddress: String,
    dataFileURL: {
        url: String,
        json: {
            assetName: String,
            blob: String,
            receiver: String (RegExp("[A-Z2-7]{58}")),
            signedLogicSig: Array
        }
    }
}
``` 
## Other BaaS services we offer.

There are also other baas services that we have developed, these include:

- [Create Company](https://github.com/deakin-launchpad/baas-service-createcompany)
- [Simple Transaction](https://github.com/deakin-launchpad/baas-service-transaction)
- [Local Counter](https://github.com/deakin-launchpad/baas-service-localCounter)
- [Transfer Assets](https://github.com/deakin-launchpad/baas-service-transferAssets)

There will be many more to come!

## Pre-requisite

- [Nodejs](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04)

## Setup Node.js

In order to setup NodeJS you need to fellow the current steps:

### Mac OS X

- Step1: Install Home brew

```
$ /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

$ brew -v
```

- Step2: Install Node using Brew

```
$ brew install node

$ node -v

$ npm -v
```

### Linux Systems

- Step1: Install Node using apt-get

```
$ sudo apt-get install curl python-software-properties

$ curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -

$ sudo apt-get install nodejs

$ node -v

$ npm -v
```

## Setup Node User Onboarding Application

- Step1: Git clone the application

```
$ git clone https://github.com/deakin-launchpad/baas-service-boilerplate.git

$ cd User-Onboarding-Module
```

- Step2: Install node modules

```
$ npm i

or

$ npm install
```

- Step3: Copy .env.example to .env

```
$ cp .env.example .env
```

- Step4: Start the application

```
$ npm run start
```

or

```
$ npm run startWithNodemon
```

The current version of your application would be running on **http://localhost:8080** or **http://IP_OF_SERVER:8080** (in case you are running on the server)
