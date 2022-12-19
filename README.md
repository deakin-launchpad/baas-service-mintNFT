# Baas-service-boilerplate

This is a very simple Node Express application that serves as a web server. This application attempts to demonstrate the building of a very simple express app as well as the creation of a few api's to effect data changes.

This is a very simple Node Hapi / Swagger application that serves services that you can create over the web. This application attempts to demonstrate the building of very simple blockchain functions that you cna perform for your client.

## Other BaaS services we offer.

There are also other baas services that we have developed, they are forks of this repository, these include:

- [Mint NFT](https://github.com/deakin-launchpad/baas-service-mintNFT)

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
