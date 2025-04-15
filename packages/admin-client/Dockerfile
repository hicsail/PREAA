FROM node:22-alpine AS builder

ARG VITE_BACKEND_BASE_URL

ENV VITE_BACKEND_BASE_URL ${VITE_BACKEND_BASE_URL}

WORKDIR /usr/src/app

COPY . .

RUN npm install --legacy-peer-deps
RUN npm run build

FROM nginx:1.27.4-alpine as prod

COPY --from=builder /usr/src/app/build .

ADD ./nginx.conf "${NGINX_CONF_PATH}"

CMD nginx -g "daemon off;"
