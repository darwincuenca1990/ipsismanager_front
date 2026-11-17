# Ipsismanager

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.3.17.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Deployment with Nginx

The repository's `nginx.conf` is a server block intended to be included from
Nginx's `http` configuration (for example, in `conf.d`). It serves the built
Angular files from `/usr/share/nginx/html` and forwards `/api` and `/media`
requests, including their original paths, to Django at `127.0.0.1:8005`.
This address assumes Nginx and Django run directly on the same host, not in
separate containers. Adjust the upstream address if Django listens elsewhere.

Build the application with `ng build --configuration production`, and deploy
the contents of `dist/ipsismanager/browser` to `/usr/share/nginx/html` (or
change the `root` in the server block). Include the configuration in Nginx,
check it with `nginx -t`, and reload Nginx. Requests to other paths fall back
to `index.html` for Angular routing; this configuration serves static files
rather than running the Angular SSR server.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
