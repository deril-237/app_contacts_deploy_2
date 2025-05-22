export default function Login() {
  return (
    <>
      <form action="">
        <div>
          <label htmlFor="email">email</label>
          <input type="email" name="email" id="email" />
        </div>
        <div>
          <label htmlFor="password">password</label>
          <input type="password" name="password" id="password" />
        </div>
        <input type="submit" value="login" />
      </form>
    </>
  )
}