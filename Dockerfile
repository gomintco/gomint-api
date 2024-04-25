# Base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

ENV DB_USERNAME=root
ENV DB_NAME=mysql
ENV TESTNET_ID=0.0.2599594
ENV TESTNET_KEY=302e020100300506032b657004220420a04c5d4726cb5539af95fe2fa304bcba84efd97dd4401e1a760696e38b3e15ba


# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN npm run build

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
