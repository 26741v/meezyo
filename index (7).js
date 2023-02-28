const axios = require('axios');

const loginUrl = 'https://vasd.powerschool.com/guardian/home.html';
const username = '26741';
const password = 'kewao';
const requestData = `dbpw=${password}&account=${username}&pw=${password}`;

// Get the current date
const currentDate = new Date();

// Find the next Tuesday and Friday
const nextTuesday = new Date(currentDate);
nextTuesday.setDate(currentDate.getDate() + ((2 - currentDate.getDay() + 7) % 7));
const nextFriday = new Date(nextTuesday);
nextFriday.setDate(nextTuesday.getDate() + ((5 - nextTuesday.getDay() + 7) % 7));

// Format the dates as strings in MM/DD/YYYY format
const fridayString = `${nextFriday.getMonth() + 1}/${nextFriday.getDate()}/${nextFriday.getFullYear()}`;
const tuesdayString = `${nextTuesday.getMonth() + 1}/${nextTuesday.getDate()}/${nextTuesday.getFullYear()}`;

console.log(fridayString); // e.g. "03/04/2023"
console.log(tuesdayString); // e.g. "03/08/2023"



axios.post(loginUrl, requestData, {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Referer': 'https://vasd.powerschool.com/public/home.html',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.78 Safari/537.36',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,en;q=0.9',
    'Upgrade-Insecure-Requests': '1'
  },
  maxRedirects: 0,
  validateStatus: function (status) {
    return status >= 200 && status < 303;
  }
})
.then(response => {
  // Assuming the login was successful, make a request to the desired URL
  const scheduleUrl = `https://vasd.powerschool.com/guardian/flexScheduling/resources/weekSessionsJSON.html?fri=${fridayString}&mon=${tuesdayString}`;
  console.log(scheduleUrl);
  const cookies = response.headers['set-cookie'];

  axios.get(scheduleUrl, {
    headers: {
      'Cookie': cookies.join('; ')
    }
  })
  .then(scheduleResponse => {
    // Find sessions with a category name of "Double Lunch"
    const doubleLunchSessions = scheduleResponse.data.filter(session => session.category_name === 'Double Lunch');
    
    // Create an array to hold the messages to be sent to the webhook
    const messages = [];

    // Add the ID and date (as a day abbreviation) for each double lunch session to the messages array
    doubleLunchSessions.forEach(session => {
      const date = new Date(session.date_value);
      const dayAbbreviation = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
      messages.push(`${dayAbbreviation} ${session.id}`);
    });

    // Create the webhook message
    const webhookMessage = {
      content: '@everyone Double lunch sessions for next week:',
      embeds: [
        {
          description: messages.join('\n')
        }
      ]
    };

    // Send the webhook message
    const webhookUrl = 'https://discordapp.com/api/webhooks/1079805529041408141/ci9IUxMmrhc6Fi8EDMx9w5kQAbuQ8zudqeBKkiqy3nIZ6tNzqv5gxnk_pPQ-TXFjD8tm';
    axios.post(webhookUrl, webhookMessage)
      .then(() => console.log('Webhook message sent successfully'))
      .catch(error => console.error('Error sending webhook message:', error));
  })
  .catch(error => {
    console.error('Error fetching schedule:', error);
  });
})
.catch(error => {
  console.error('Error logging in:', error);
});