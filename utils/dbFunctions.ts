import Nylas from 'nylas';
import { auth, adminDb } from '../firebase_admin_config'
import { convertToDT, summarizeTranscript } from './convoUtils';
import {log} from '@logtail/next'
import { RoundRobin } from 'nylas/lib/models/calendar-availability'
import Event from 'nylas/lib/models/event'
import * as CONSTANTS from '../constants'

export const retrieveTimeInterval = async (uid: string) => {

}

export const scheduleAllanMeeting = async(leadName: string, phoneNumber: string, availableTime: string, transcript: string)=>{
  //let availNow = (await adminDb.collection('users').doc(CONSTANTS.YASH_ID).get()).data()!.avail_now;
  //let nextUp = (await adminDb.collection('users').doc(CONSTANTS.YASH_ID).get()).data()!.next_up_closer;
  let availNow = ['allan@tryraz.com']
  let nextUp = 0;
  Nylas.config({
    clientId: "8fzfak1ia7gvcklo538lwff7u",
    clientSecret: "4vi8hpimj7tt1ztsyfk8huxfw",
  });
  
  //yash const nylas = Nylas.with("ApYZSAj3xbT61AwlXUae6iEUklgcFw");
  let nylas = Nylas.with("NNWz0ZF6eFgwXEzfmaaNQpgsw6Z7Y6");

  let re = await convertToDT(availableTime);
  log.info('converted time: '+ re);
  let st = new Date(re);

  let startTime = st.getTime() / 1000;
  log.info('time in s: ' + startTime);

  const endTime = startTime + (60 * 60 * 1) // add 1 hours in seconds          

  const availability = await nylas.calendars.availability({
    startTime: startTime,
    endTime: endTime,
    duration: 45,
    interval: 15,
    emails: availNow,
    roundRobin: RoundRobin.MaxAvailability
  });

  let closerPicked = '';
  let meetingStart = 0;
  let meetingEnd = 0;
  for (let slot of availability.timeSlots) {
    if (slot.emails != undefined){
      log.info('timeslot: ' + slot);
      log.info('start time: ' + new Date(slot.startTime * 1000).toLocaleString());
      if (slot.emails.length > 0){
        //filter out yash@bylders.co from array
        let choices = slot.emails.filter((email: string) => email !== 'yash@bylders.co');
        log.info('choices: ' + choices);
        log.info(availNow[nextUp]);
        // make it so we pick the next available closer
        if (choices.includes(availNow[nextUp])){
          closerPicked = availNow[nextUp];
          nextUp = (nextUp + 1) % availNow.length;
          await adminDb.collection('users').doc(CONSTANTS.YASH_ID).update({next_up_closer: nextUp});

        } else {
          //if the next up closer is not available, pick a random closer
          let index = Math.floor(Math.random() * choices.length);
          closerPicked = choices[index];
        }
        
      
        //randomly choose an index
        // let index = Math.floor(Math.random() * choices.length);
        // closerPicked = choices[index];
      }

      meetingStart =slot.startTime
      meetingEnd = slot.endTime
    }
    if (meetingStart > 0){
      break;
    }
  } 
  if (meetingStart == 0){
    meetingStart = new Date().getTime() / 1000;
    meetingEnd = meetingStart + (60 * 60 * .75) // add 1 hours in seconds
  }

  let convoSummary = await summarizeTranscript(transcript, leadName);
  // for scheduling attach to raz cal
  nylas = Nylas.with('7jSI687IwtlCSVOmPahFH96qTtB59i');
  const event = new Event(nylas, {
    title: `${leadName} ${phoneNumber} Publishing.com Call`,
    location: 'Google Meet',
    when: { startTime: meetingStart, endTime: meetingEnd },
    participants: [{ email: closerPicked }],
    calendarId: "bty8hzjh8is2c7h1yu304llg1",
    description: convoSummary,
   
  });
  log.info('Event created: ' + event);


  return event;  
}


export const scheduleYashMeeting = async(leadName: string, phoneNumber: string, availableTime: string, transcript: string)=>{
  let availNow = (await adminDb.collection('users').doc(CONSTANTS.YASH_ID).get()).data()!.avail_now;
  let nextUp = (await adminDb.collection('users').doc(CONSTANTS.YASH_ID).get()).data()!.next_up_closer;
  Nylas.config({
    clientId: "8fzfak1ia7gvcklo538lwff7u",
    clientSecret: "4vi8hpimj7tt1ztsyfk8huxfw",
  });
  
  //yash const nylas = Nylas.with("ApYZSAj3xbT61AwlXUae6iEUklgcFw");
  let nylas = Nylas.with("HL8ASQP3u6ihioTqEVvRIzWRyXGHru");

  let re = await convertToDT(availableTime);
  log.info('converted time: '+ re);
  let st = new Date(re);

  let startTime = st.getTime() / 1000;
  log.info('time in s: ' + startTime);

  const endTime = startTime + (60 * 60 * 1) // add 1 hours in seconds          

  const availability = await nylas.calendars.availability({
    startTime: startTime,
    endTime: endTime,
    duration: 45,
    interval: 15,
    emails: availNow,
    roundRobin: RoundRobin.MaxAvailability
  });

  let closerPicked = '';
  let meetingStart = 0;
  let meetingEnd = 0;
  for (let slot of availability.timeSlots) {
    if (slot.emails != undefined){
      log.info('timeslot: ' + slot);
      log.info('start time: ' + new Date(slot.startTime * 1000).toLocaleString());
      if (slot.emails.length > 0){
        //filter out yash@bylders.co from array
        let choices = slot.emails.filter((email: string) => email !== 'yash@bylders.co');
        log.info('choices: ' + choices);
        log.info(availNow[nextUp]);
        // make it so we pick the next available closer
        if (choices.includes(availNow[nextUp])){
          closerPicked = availNow[nextUp];
          nextUp = (nextUp + 1) % availNow.length;
          await adminDb.collection('users').doc(CONSTANTS.YASH_ID).update({next_up_closer: nextUp});

        } else {
          //if the next up closer is not available, pick a random closer
          let index = Math.floor(Math.random() * choices.length);
          closerPicked = choices[index];
        }
        
      
        //randomly choose an index
        // let index = Math.floor(Math.random() * choices.length);
        // closerPicked = choices[index];
      }

      meetingStart =slot.startTime
      meetingEnd = slot.endTime
    }
    if (meetingStart > 0){
      break;
    }
  } 
  if (meetingStart == 0){
    meetingStart = new Date().getTime() / 1000;
    meetingEnd = meetingStart + (60 * 60 * .75) // add 1 hours in seconds
  } 
  if (closerPicked == '' || closerPicked == undefined){
    closerPicked = 'dino@bylders.co'
  }

  let convoSummary = await summarizeTranscript(transcript, leadName);
  // for scheduling attach to raz cal
  nylas = Nylas.with('7jSI687IwtlCSVOmPahFH96qTtB59i');
  const event = new Event(nylas, {
    title: `Bylders Sales Call - ${leadName} ${phoneNumber} `,
    location: 'Google Meet',
    when: { startTime: meetingStart, endTime: meetingEnd },
    participants: [{ email: closerPicked }, {email: 'team@bylders.co'}],
    calendarId: "bty8hzjh8is2c7h1yu304llg1",
    description: convoSummary,
   
  });
  log.info('Event created: ' + event);


  return event;  
}

// export const rescheduleAllanMeeting = async(meetingId: string, availableTime: string)=>{
//   Nylas.config({
//     clientId: "8fzfak1ia7gvcklo538lwff7u",
//     clientSecret: "4vi8hpimj7tt1ztsyfk8huxfw",
//   });
  
//   let nylas = Nylas.with("7jSI687IwtlCSVOmPahFH96qTtB59i");

//   let re = await convertToDT(availableTime);
//   log.info('converted time: '+ re);
//   let st = new Date(re);

//   let startTime = st.getTime() / 1000;
//   log.info('time in s: ' + startTime);

//   const endTime = startTime + (60 * 60 * .75) // add 45 min in sec 
  
//   const oldEvent = await nylas.events.find(meetingId);
//   console.log(oldEvent);
//   oldEvent.when.startTime = startTime;
//   oldEvent.when.endTime = endTime;

//   return oldEvent;
 
// }


export const rescheduleYashMeeting = async(meetingId: string, availableTime: string)=>{
  Nylas.config({
    clientId: "8fzfak1ia7gvcklo538lwff7u",
    clientSecret: "4vi8hpimj7tt1ztsyfk8huxfw",
  });
  
  let nylas = Nylas.with("7jSI687IwtlCSVOmPahFH96qTtB59i");

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
 const dayOfWeek = daysOfWeek[new Date().getDay()];

  log.info(`Your job is to convert the time into js Date format (e.g. 2024-02-27T20:00:00-04:00) in EST. For added context, the time right now is ${dayOfWeek}, ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST  \n Date to convert: ${availableTime}`);

  let re = await convertToDT(availableTime);
  log.info('converted time: '+ re);


  let st = new Date(re);

  let startTime = st.getTime() / 1000;
  log.info('time in s: ' + startTime);

  const endTime = startTime + (60 * 60 * .75) // add 45 min in sec 
  
  const oldEvent = await nylas.events.find(meetingId);
  console.log(oldEvent);
  oldEvent.when.startTime = startTime;
  oldEvent.when.endTime = endTime;

  return oldEvent;
 
}


export const calculateTwilioSMSCredits = (message: string) => {
  const gsm7Regex = RegExp("^[A-Za-z0-9 \\r\\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!\"#¤%&'()*+,-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[\\]~\\|€]*$");
  const isGSM7 = gsm7Regex.test(message);
  const singleSegmentLimit = isGSM7 ? 160 : 70;
  const multiSegmentLimit = isGSM7 ? 153 : 67;

  if (message.length <= singleSegmentLimit) {
    return 1; // Single segment
  } else {
    // Calculate the number of segments for a multi-part message
    return Math.ceil(message.length / multiSegmentLimit);
  }
}

export const assignPhoneECJ = (phoneNumber: string, idxSize: number) => {
  let hash = 0;
  for (let i = 6; i < phoneNumber.length; i++) {
      const char = phoneNumber.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
  }

  // Improved uniform distribution using bitwise operations to ensure a positive hash value
  const positiveHash = hash >>> 0; // Convert to unsigned 32-bit integer to ensure positivity
  const teamMemberIndex = positiveHash % idxSize;

  return teamMemberIndex;
};


export const retrieveIGInfo = async (apikey: string): Promise<any> => {
  const keylookup = (await adminDb.collection('mappings').doc('apikeys').get()).data()
  let uid = undefined;
  let pageToUse = undefined;
  if (keylookup != undefined && apikey != undefined){
    uid = keylookup['apikeys'][apikey];
  
    const pages = keylookup['igpage'];
    
    for (const [key, value] of Object.entries(pages)) {
      if (value == uid){
        pageToUse = key;
      }
    }
  }


  return {'uid': uid, 'pageToUse': pageToUse};
}


export const retrieveAccountInfo = async (apikey: string): Promise<any> => {
    const keylookup = (await adminDb.collection('mappings').doc('apikeys').get()).data()
    let uid = undefined;
    let phoneToUse = undefined;
    if (keylookup != undefined && apikey != undefined){
      uid = keylookup['apikeys'][apikey];
    
      const phoneNumbers = keylookup['phoneNumbers'];
      
      for (const [key, value] of Object.entries(phoneNumbers)) {
        if (value == uid){
          phoneToUse = key;
        }
      }
    }

 
    return {'uid': uid, 'phoneToUse': phoneToUse};
}

export const retrievApiKey= async (uid: string): Promise<string> => {
  const keylookup = (await adminDb.collection('mappings').doc('apikeys').get()).data()
  let apikey = '';
  if (keylookup != undefined && uid != undefined){
  
    const keys = keylookup['apikeys'];
    
    for (const [key, value] of Object.entries(keys)) {
      if (value == uid){
        apikey = key;
      }
    }
  }
  return apikey;
}