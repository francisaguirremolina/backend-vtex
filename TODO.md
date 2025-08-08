# New App TODOs
### Bootstrapping
- [x]  Run boilerplate-cli to generate a new app
- [x]  Change/add enviroment variables in `.env` file
- [x]  Configure the integration modifying the `config/app.ts`  file
- [x]  Add carrier-package dependency if there is one
- [x]  Replace/define carrier's interfaces in `interfaces/carrier.interface.ts` or import them from package if exists


### Onboarding
- [x]  **VTEX**: Authenticate with VTEX (check if need full access credentials or with limited permissions)
  - [x]  Webhooks suscription
  - [x]  Carrier creation
- [ ]  **Carrier**: Check carrier credentials and any other necessary information (like country) (in `controllers/onboarding.controller.ts`)
  - [ ]  Adapt authenticate endpoint
  - [ ]  Implement authenticate function from client's SDK 
  - [x]  Save in DDBB (and encrypt if necessary)
  - [ ]  **Carrier**: Extra endpoints



### Webhooks
- [ ]  Handle order created (in `controllers/webhooks.controller.ts`)
  -  [x]  If necessary, retrieve order from Ecommerce for extra data
  -  [x]  Save in DDBB
  -  [ ]  Adapt  **dbToCarrier** function in `services/formatting.service/order.formatting`
  -  [ ]  Implement  **createShipping** function of client's SDK and pass the formatted order
- [ ]  Handle order status
  - [ ]  Save in DDBB
  - [ ]  Notify the ecommerce: Call vtexService.tryToAddTrackingInfo() after fetching tracking details from carrier

### Finishing
- [ ]  Update Postman collection and copy to */docs* folder
- [ ]  Adapt and/or extend README.md
  - [ ]  Environment Variables
  - [ ]  Project Structure
  - [ ]  API Endpoints
  - [ ]  Any other relevant or particular information

### Testing
- [x] Mongoose Models
  - [ ] Adapt Order
  - [ ] Adapt User
- [ ] Services
  - [ ] `services/carrier.service.ts`
  - [ ] `services/vtex.service.ts`
  - [ ] `services/auth.service.ts`
  - [ ] `services/formatting.service.ts`
  - [ ] `services/db.service.ts`
- [ ] Middlewares
  - [x] `middlewares/error.middleware.ts`
  - [ ] Other middlewares
- [ ] Routes
  - [ ] `routes/auth.routes.ts`   
  - [ ] `routes/onboarding.routes.ts`
  - [ ] `routes/webhooks.routes.ts`
  - [ ] `routes/panel.routes.ts`
  