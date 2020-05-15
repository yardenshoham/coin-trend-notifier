import notifierManager from "./../managers/notifierManager";
import emailer from "../notifiers/emailer";
import pushNotifications from "../notifiers/pushNotifications";

export default () => {
  notifierManager.register(emailer);
  notifierManager.register(pushNotifications);
};
