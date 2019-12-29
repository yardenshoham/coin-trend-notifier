/**
 * The payload that will be contained in the jwt sent to the user after login.
 */
export default interface UserJwtPayload {
  /**
   * The MongoDB id of the user's document.
   */
  _id: string;

  /**
   * The [numeric date](https://ldapwiki.com/wiki/NumericDate) at which the jwt was signed.
   */
  iat?: number;
}
