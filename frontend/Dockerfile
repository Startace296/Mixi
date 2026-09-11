# build stage
FROM node:26-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# Nhận VITE_API_URL từ CI build arg (baked vào lúc build)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# run stage
FROM nginx:alpine

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
