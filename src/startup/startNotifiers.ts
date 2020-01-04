import notifierManager from "./../managers/notifierManager";
import emailer from "../notifiers/emailer";

export default () => {
  notifierManager.register(emailer);
};
