import { sendMail } from "./utils/email";

const htmlBody = `
<p>Bonjour </p>
`;

sendMail('asta84702@gmail.com', 'title', htmlBody); 