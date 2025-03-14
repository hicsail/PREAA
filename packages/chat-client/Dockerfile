FROM node:20-alpine as client

WORKDIR /app

# Accept build arguments
ARG VITE_BACKEND_BASE_URL

# Set environment variables
ENV VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL

COPY ./package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM nginx as prod

# Copy your custom nginx.conf file into the container
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy React Build into html folder
COPY --from=client /app/dist /usr/share/nginx/html
