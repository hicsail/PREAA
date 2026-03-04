FROM node:22-alpine AS builder

ARG VITE_BACKEND_BASE_URL

ENV VITE_BACKEND_BASE_URL=${VITE_BACKEND_BASE_URL}

WORKDIR /usr/src/app

COPY . .

RUN npm install
RUN npm run build

FROM nginx:1.27.4-alpine AS prod

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD nginx -g "daemon off;"
