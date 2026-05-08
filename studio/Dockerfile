FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_CORTEX_URL=""
ARG VITE_CORTEX_WS_URL=""
ENV VITE_CORTEX_URL=$VITE_CORTEX_URL
ENV VITE_CORTEX_WS_URL=$VITE_CORTEX_WS_URL

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
