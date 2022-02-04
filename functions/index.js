import { clientId } from './keys';
import { clientSecret } from './keys';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Database reference
const dbRef = admin.firestore().doc('tokens/demo');

// Twitter API init
const TwitterApi = require('twitter-api-v2').default;
const twitterClient = new TwitterApi({
  clientId: 'CLIENT_ID',
  clientSecret: 'CLIENT_SECRET',
});

const callbackURL = 'http://localhost:5000/bingbangbot/us-central1/callback';

exports.auth = functions.https.onRequest((request, response)  => {
 
});
exports.callback = functions.https.onRequest((request, response) => {
    const { state, code } = request.query;
  
    const dbSnapshot = await dbRef.get();
    const { codeVerifier, state: storedState } = dbSnapshot.data();
  
    if (state !== storedState) {
      return response.status(400).send('Stored tokens do not match!');
    }
  
    const {
      client: loggedClient,
      accessToken,
      refreshToken,
    } = await twitterClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: callbackURL,
    });
  
    await dbRef.set({ accessToken, refreshToken });
  
    const { data } = await loggedClient.v2.me(); // start using the client if you want
  
    response.send(data);
  });
  
  // STEP 3 - Refresh tokens and post tweets
  exports.tweet = functions.https.onRequest((request, response) => {
    const { refreshToken } = (await dbRef.get()).data();
  
    const {
      client: refreshedClient,
      accessToken,
      refreshToken: newRefreshToken,
    } = await twitterClient.refreshOAuth2Token(refreshToken);
  
    await dbRef.set({ accessToken, refreshToken: newRefreshToken });
  
    const nextTweet = await openai.createCompletion('text-davinci-001', {
      prompt: 'tweet something cool for #techtwitter',
      max_tokens: 64,
    });
  
    const { data } = await refreshedClient.v2.tweet(
      nextTweet.data.choices[0].text
    );
  
    response.send(data);
  });