import moment from "moment";
import { adminDb } from "../firebase_admin_config";
import { chatCall, chatCallAzureSweed, structuredChatCall, structuredChatCallAzure } from "./chatCall";

export const getUserMessages= (msgs: ChatAPICallMessage[], leadName: string) => {
  let transcript = '';
  // loop over all the messages starting with the 2nd message
  for (let i = 2; i < msgs.length; i++){
    const message = msgs[i];
    // if the message is from the user, add a newline
    if (message['role'] == 'user'){
        transcript += `${leadName}: `;
        // add the message content
        transcript += message['content'] + '\n';
    }
  }
  return transcript;
}


export const getTranscript = (msgs: ChatAPICallMessage[], leadName: string) => {
    let transcript = '';
    // loop over all the messages starting with the 2nd message
    for (let i = 2; i < msgs.length; i++){
      const message = msgs[i];
      // if the message is from the user, add a newline
      if (message['role'] == 'user'){
          transcript += `${leadName}: `;
      }
      else if (message['role'] == 'assistant'){
          transcript += `AI: `;
      }
      // add the message content
      transcript += message['content'] + '\n';
    }
    return transcript;
}

export const getHTMLTranscript = (msgs: ChatAPICallMessage[], leadName: string) => {  
    //format the transcript to be sent to the webhook for gdrive
    let formattedTranscript = '<html><body>';
    // loop over all the messages starting with the 2nd message
    for (let i = 2; i < msgs.length; i++){
    const message = msgs[i];
        formattedTranscript += '<p>'
        // if the message is from the user, add a newline
        if (message['role'] == 'user'){
        formattedTranscript += `${leadName}: `;
        }
        else if (message['role'] == 'assistant'){
        formattedTranscript += `AI: `;
        }
        // add the message content
        formattedTranscript += message['content'] + '</p>';
    }
    formattedTranscript += '</body></html>';
    return formattedTranscript;
}

export const summarizeTranscript = async(transcript: string, leadName: string) => {
  let msgs: ChatAPICallMessage[] = [];
  let prompt = `You just had a conversation with a new lead, and your job now is to summarize the main points of what the lead, ${leadName}, said during the conversation in three sentences, so that we can send the report to the sales team. Make sure to include details about what the lead if they provide them. You do not need to incorporate scheduling details into your sumamry\n ${transcript}`;
  msgs.push({role: 'user', content: prompt});
  let respMessage = await chatCallAzureSweed(msgs);
  return respMessage;
}


const callGPTFunctionMultiArg = async(prompt: string, func: ChatAPIFunction[], model: string = 'gpt-4') => {
        
  let thread: ChatAPICallMessage[] = [];
//  let prompt = `Given the following message, determine whether the lead has explicitly asked that we don't contact them anymore. \n MESSAGE: ${message}`;

  thread.push({role: 'user', content: prompt});

  let respArgs = await structuredChatCallAzure(thread, func, model)
  let respJson = undefined;
  let res: any = {};
  try {
    respJson = JSON.parse(respArgs);
    for (let params of func[0].parameters.required){
      res[params] = respJson[params];
    }
  } catch (error) {
    console.log(error);
  }

  return res;
}

const callGPTFunction = async(prompt: string, func: ChatAPIFunction[]) => {
  const model = 'gpt-4';
        
  let thread: ChatAPICallMessage[] = [];
//  let prompt = `Given the following message, determine whether the lead has explicitly asked that we don't contact them anymore. \n MESSAGE: ${message}`;

  thread.push({role: 'user', content: prompt});

  let respArgs = await structuredChatCallAzure(thread, func, model)
  console.log('received a response from the function call: ' + func[0].name);
  let respJson = undefined;
  let res = false;
  try {
    respJson = JSON.parse(respArgs);
    let attr = func[0].parameters.required[0]
    res = respJson[attr];
  } catch (error) {
    console.log(error);
    return false;
  }

  return res;
}



export const checkIfMeetingConfirmed = async(transcript: string) => {
  let prompt = `Given the transcript, determine whether the lead confirmed that they have booked an appointment. \n ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'meeting_confirmed_status',
    description: 'a function that saves the results of whether the meeting has been confirmed or not',
    parameters: {
        type: 'object',
        properties: {
            'status': {
                type: 'boolean',
                description: 'true/false depending on whether the meeting was confirmed by the lead'
            }
        },
        required: ["status"]
    }
  }]

  let status = await callGPTFunction(prompt, func);
  return status;
}

export const checkIfTanerMentioned = async(transcript: string) => {
  let prompt = `Given the transcript, determine whether the AI has mentioned that the lead has a call set up with Taner \n ${transcript}`;
  
  const func: ChatAPIFunction[] = [{
    name: 'meeting_with_Taner_mentioned',
    description: 'a function that saves the results of whether the lead has a call with Taner',
    parameters: {
        type: 'object',
        properties: {
            'status': {
                type: 'boolean',
                description: 'true/false depending on whether the AI mentions the call with Taner'
            }
        },
        required: ["status"]
    }
  }]

  let status = await callGPTFunction(prompt, func);
  return status;

}



export const checkIfQualifiedCountry = async(transcript: string) => {
          
  let prompt = `The following is a transcript of a conversation you have been having with a lead. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'extract_lead_country',
    description: 'a function that should be run to figure out whether the lead is from a country that is qualified for the program',
    parameters: {
        type: 'object',
        properties: {
            'lead_from_usa': {
                type: 'boolean',
                description: 'true/false depending on whether the lead says they are from usa/one of the states in the usa'
            },
            'lead_from_unqualified_country': {
                type: 'boolean',
                description: 'true/false depending on whether the lead says they are from India, Pakistan, or any country in Africa'
            },
            'lead_answers_where_from': {
                type: 'boolean',
                description: 'true/false depending on whether the lead says where they are from/located'
            }
          },
        
        required: ["lead_from_usa", "lead_from_unqualified_country", "lead_answers_where_from"]
    }
    }]
    
  let optOutResult = await callGPTFunctionMultiArg(prompt, func);
  console.log(optOutResult);
  return optOutResult;
}







export const checkIfLeadOptedOut = async(transcript: string) => {
          
  let prompt = `The following is a transcript of a conversation you have been having with a lead. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'lead_requests_opt_out',
    description: 'a function that should be run when the lead explicitly requests that we no longer contact them or they write STOP or they say they are not interested',
    parameters: {
        type: 'object',
        properties: {
            'opt_out_request': {
                type: 'boolean',
                description: 'true/false depending on whether the message sent by the lead is an explicit request that we no longer contact them or they write STOP or they say they are not interested'
            },
            'lead_says_wrong_number': {
                type: 'boolean',
                description: 'true/false depending on whether the lead says AI the wrong number'
            }
          },
        
        required: ["opt_out_request", "lead_says_wrong_number"]
    }
    }]
    
  let optOutResult = await callGPTFunctionMultiArg(prompt, func);
  console.log(optOutResult);
  return optOutResult;
}



export const checkIfDisqualifiedECJ = async(transcript: string) => {

  let prompt = `The following is a transcript of a conversation you have been having with a lead. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_qualification',
    description: 'a function that should be run to register if the lead qualifies for an interview ',
    parameters: {
        type: 'object',
        properties: {
            'budget_below_1000': {
                type: 'boolean',
                description: 'true ONLY if the lead has no money or their budget is below 1000'
            },
            'discord_mentioned': {
                type: 'boolean',
                description: 'true ONLY if the lead does not qualify for an interview and the link for the discord has been shared'
            },
            'lead_under_18': {
                type: 'boolean',
                description: 'true ONLY if the lead says they are 17 or younger'
            } 

        },
        required: ["budget_below_1000", "discord_mentioned", "lead_under_18"]
    }
  }]

  let disqResult = await callGPTFunctionMultiArg(prompt, func);
  console.log(disqResult);
  return disqResult;
}

export const checkIfDisqualifiedYash = async(transcript: string) => {

  let prompt = `The following is a transcript of a conversation you have been having with a lead. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_qualification',
    description: 'a function that should be run to register if the leads credit score is below 580',
    parameters: {
        type: 'object',
        properties: {
            'credit_score_below_580': {
                type: 'boolean',
                description: 'true ONLY if the lead says their credit score is below 580'
            },
            'credit_score_asked': {
                type: 'boolean',
                description: 'true ONLY if the ai asks the lead for their credit score'
            },

        },
        required: ["credit_score_below_580", "credit_score_asked"],
    }
  }]

  let disqResult = await callGPTFunctionMultiArg(prompt, func);
  console.log(disqResult);
  return disqResult;

}
export const checkIfLeadJoinedDiscord = async(transcript: string) => {
  let prompt = `Given the following transcript, determine whether the lead has confirmed they joined the discord: \nTRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'discord_confirmation_check',
    description: 'Determine whether the lead joined the discord',
    parameters: {
        type: 'object',
        properties: {
            'joined_discord': {
                type: 'boolean',
                description: 'true/false depending on whether the lead confirms they joined the discord'
            }
        },
        required: ["joined_discord"]
    }
  }]

  let isQuestion = await callGPTFunction(prompt, func);
  return isQuestion;
}

export const checkIfSayingThanks = async(transcript: string) => {
  let prompt = `Given the following transcript, determine whether the AI should respond to the leads last message or whether the conversation has ended: \nTRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'message_warrants_response',
    description: 'Determine whether the message warrants a response from the AI',
    parameters: {
        type: 'object',
        properties: {
            'should_respond': {
                type: 'boolean',
                description: 'true/false depending on whether the message warrants a response from the AI. Dont say thank you too many times'
            }
        },
        required: ["should_respond"]
    }
  }]

  let isQuestion = await callGPTFunction(prompt, func);
  return isQuestion;
}

export const checkIfExistingConvo = async(transcript: string) => {
  let prompt = `Given the following transcript, determine whether the lead is currently having a text conversation with Jacob or a rep at the AI's company: \nTRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'user_indicates_existing_text_convo',
    description: 'Determine whether the user is suggesting they are currently having a text conversation with Jacob or another rep at the AI\'s company',
    parameters: {
        type: 'object',
        properties: {
            'existing_text_convo': {
                type: 'boolean',
                description: `true/false depending on whether the user is suggesting they are currently having a text conversation with Jacob or a rep at the AI\'s company
                Example input/output:
                Input 1: "Are you texting me right now?", Output 1: true
                Input 2: "Someone from your team says they are messaging me", Output 2: true
                Input 3: "I want to apply to have you mentor me", Output 3: false,
                Input 4: "I already applied", Output 4: true,
                Input 5: "Hey are you doing mentorships?", Output 5: false,
                Input 6: "Is [insert name] someone from your team?", Output 6: true,
                `
            }
        },
        required: ["existing_text_convo"]
    }
  }]

  let isQuestion = await callGPTFunction(prompt, func);
  
  return isQuestion;
}

export const checkIfQuestion = async(message: string) => {
  let prompt = `Given the following message, determine whether it is a question: \n ${message}`;

  const func: ChatAPIFunction[] = [{
    name: 'message_is_question',
    description: 'Determine whether the message is a question',
    parameters: {
        type: 'object',
        properties: {
            'is_question': {
                type: 'boolean',
                description: 'true/false depending on whether the message is a question.'
            }
        },
        required: ["is_question"]
    }
  }]

  let isQuestion = await callGPTFunction(prompt, func);
  return isQuestion;
}

export const checkIfAskingQuestion = async(transcript: string) => {
  let prompt = `Given the transcript, determine whether the user is asking a question at the end of the transcript. \n ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'final_message_is_question',
    description: 'a function that determines whether the users final message is a question that requires a response from us.',
    parameters: {
        type: 'object',
        properties: {
            'is_question': {
                type: 'boolean',
                description: 'true/false depending on whether the users final message was a question that requires a response from us.'
            }
        },
        required: ["is_question"]
    }
  }]


  let reconfirmCallResult = await callGPTFunction(prompt, func);
  return reconfirmCallResult;
}


export const getUTCTimeECJ = async(transcript: string) => {
  let prompt = `Given the transcript, determine what time the lead would like to be called by the head of enrollment. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_consent_for_exec_call',
    description: 'a function that should be run to register the time the lead would like to be called by the head of enrollment',
    parameters: {
        type: 'object',
        properties: {
            'available_time_in_est_tz': {
                type: 'string',
                description: 'use the format HH:MM AM/PM to specify the time the lead would like to be called by the head of enrollment in the EST time zone (you may need to consider where they are located to convert to EST)'
            },
            'available_now': {
                type: 'boolean',
                description: 'true/false depending on whether the lead is available now (if they only say sounds good they are available now)'
            },
            'avilable_day': {
                type: 'string',
                description: 'the day the lead is available',
                default: 'today'
            }
        },
        required: ["available_time_in_est_tz", "available_now", "avilable_day"]
    }
  }]

  let openToCallResult = await callGPTFunctionMultiArg(prompt, func);
  console.log(openToCallResult);
  return openToCallResult;
}


export const convertToDT = async(transcript: string) => {
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let timeRightNowEST = moment().utcOffset(-7).toDate();
  let day = daysOfWeek[timeRightNowEST.getDay()];
  
  let prompt = `Your job is to convert the time into js Date format (e.g. 2024-02-27T20:00:00-04:00) in EST. For added context, the time right now is ${day}, ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} EST  \n Date to convert: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'convert_to_date',
    description: 'a function that converts the time into js Date format in EST',
    parameters: {
        type: 'object',
        properties: {
            'js_date_in_est': {
                type: 'string',
                description: `use this exact format YYYY-MM-DDTHH:MM:SS-04:00 to specify the time in EST.
                (Example intput: 12 PM today  ${moment().startOf('day').add(12, 'hours').utcOffset(-4).format('YYYY-MM-DDTHH:mm:ss-04:00')})
                (Example intput: 5 PM tomorrow, ${moment().startOf('day').add(1, 'day').add(17, 'hours').utcOffset(-4).format('YYYY-MM-DDTHH:mm:ss-04:00')})
                `
            },
        },
        required: ["js_date_in_est"]
    }
  }]

  let openToCallResult = await callGPTFunction(prompt, func) as unknown as string;
  console.log(openToCallResult);
  return openToCallResult;
}



export const getUTCTime = async(transcript: string) => {
  let prompt = `Given the transcript, determine what time the lead would like to be called by the exec. You MUST consider where in the world the user is, as the AI asks this specifically early on in the convesration \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_consent_for_exec_call',
    description: 'a function that should be run to register the time the lead would like to be called by the exec',
    parameters: {
        type: 'object',
        properties: {
            'available_time_in_est_tz': {
                type: 'string',
                description: 'use the format HH:MM AM/PM to specify the time the lead would like to be called by the exec in the EST time zone (you need to consider early on in the conversation where the user mentions WHERE THEY ARE LOCATED IN THE WORLD to convert to EST). For example, MST is 2 hours behind EST'
            },
            'avilable_day': {
                type: 'string',
                description: 'the day the lead is available',
                default: 'today'
            }
        },
        required: ["available_time_in_est_tz", "avilable_day"]
    }
  }]

  let openToCallResult = await callGPTFunctionMultiArg(prompt, func);
  console.log(openToCallResult);
  return openToCallResult;
}


export const checkIfLeadDelayingVideoECJ = async(transcript: string, leadName: string) => {
  let prompt = `Given the transcript, determine if ${leadName} is saying something relating to when they can watch AI's video \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_precall_vid_watched',
    description: `a function that should be run to register whether ${leadName}is saying something relating to when they can watch AI's video`,
    parameters: {
        type: 'object',
        properties: {
            'lead_cannot_watch_video_now': {
                type: 'boolean',
                description: `True if ${leadName} is saying something relating to when they can watch AI's video`
            }
        },
        required: ["lead_cannot_watch_video_now"]
    }
  }]

  let openToCallResult = await callGPTFunction(prompt, func);
  console.log(openToCallResult);
  return openToCallResult;
}




export const checkIfThoughtsOnVideoECJ = async(transcript: string, leadName: string) => {
  let prompt = `Given the transcript, determine if ${leadName} has provided their thoughts on or have watched the precall video the AI sent \n TRANSCRIPT: ${transcript}
  Even if the lead makes a comment after we send them the video about how they are excited, or about dropshopping, or asks a question, or talks about Jacob/AI's attitutde, this implies they watched the video.
  `;

  const func: ChatAPIFunction[] = [{
    name: 'register_precall_vid_watched',
    description: `a function that should be run to register whether ${leadName} has provided their thoughts on or have watched the precall video the AI sent`,
    parameters: {
        type: 'object',
        properties: {
            'lead_provided_thoughts_on_precall_vid': {
                type: 'boolean',
                description: `True if ${leadName} is has provided their thoughts on or have watched the precall video the AI sent (Even if the lead makes a comment after we send them the video about how they are excited, or about dropshopping, or asks a question, or talks about Jacob/AI's attitutde, this implies they watched the video), false if they have not`
            }
        },
        required: ["lead_provided_thoughts_on_precall_vid"]
    }
  }]

  let openToCallResult = await callGPTFunction(prompt, func);
  console.log(openToCallResult);
  return openToCallResult;
}



export const checkIfConfirmedCallECJ = async(transcript: string, leadName: string) => {
  let prompt = `Given the transcript, determine if ${leadName} is available to be called by the AI's right hand man. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_live_exec_call',
    description: `a function that should be run to register whether ${leadName} is explicitly confirming to receive a call from the AI\'s right hand right now`,
    parameters: {
        type: 'object',
        properties: {
            'consenting_to_meet_right_hand': {
                type: 'boolean',
                description: `True if ${leadName} is explicitly consenting to meeting AI\'s right hand. False if they are not consenting to meeting AI\'s right hand`
            },
            'lead_available_within_next_30': {
              type: 'boolean',
              description: `True if ${leadName} says they are available to talk now or within the next 30 minutes (they agree to call without suggesting alternative time beyond 30 minutes from now), false if they are proposing a much later time for the call (e.g. "Sure, 1:30pm work?")`
            }
        },
        required: ["consenting_to_meet_right_hand", "lead_available_within_next_30"]
    }
  }]

  let openToCallResult = await callGPTFunctionMultiArg(prompt, func, 'gpt-4');
  console.log(openToCallResult);
  return openToCallResult;
}


export const checkIfAskingForReschedule = async(transcript: string) => {
  let prompt = `Given the transcript of the user messages, determine whether the user is saying they will need to reschedule or delay the call. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_rescheduled_call',
    description: 'a function that should be run to register whether the useris saying they will need to reschedule or delay the call',
    parameters: {
        type: 'object',
        properties: {
            'lead_asking_for_reschedule': {
              type: 'boolean',
              description: `True only if user is saying they will need to reschedule or move the original time of the call`
            },
        },
        required: ["lead_asking_for_reschedule"]
    }
  }]

  let reschedule = await callGPTFunction(prompt, func);
  return reschedule;
}


export const checkIfRescheduledCall = async(transcript: string) => {
  let prompt = `Given the transcript, determine whether the user confirmed that they are no longer able to make the call and they need to reschedule a call with one of the execs at the AI\'s company. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_rescheduled_call',
    description: 'a function that should be run to register whether the user confirmed that they are no longer able to make the call and they need to reschedule a call with one of the execs at the AI\'s company',
    parameters: {
        type: 'object',
        properties: {
            'lead_confirms_rescheduled_time': {
              type: 'boolean',
              description: `True only if user confirms they will no longer be able to make the call and propses a new specific time to speak with the executive. Needs to be more than just a day "I can do Friday", but a specific time, e.g. "I can do 8PM"`
            },
            'lead_asking_for_rescheduled_call_relative_to_now': {
              type: 'boolean',
              description: `True only if user is no longer able to make the original call and is requesting a rescheduled call relative to now, e.g. "Can we talk in 15 minutes?" or "Can we talk in 2 hours?" False if they ask for a specific time, e.g. "Can we talk at 3PM?"`
            }
        },
        required: ["lead_confirms_rescheduled_time", 'lead_asking_for_rescheduled_call_relative_to_now']
    }
  }]

  let openToCallResult = await callGPTFunctionMultiArg(prompt, func, 'gpt-4');
  console.log(openToCallResult);
  return openToCallResult;
}


export const checkIfConfirmedCallPrime = async(transcript: string) => {
  let prompt = `Given the transcript, determine whether the user confirmed a time for a call with the AI\'s company. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_live_exec_call',
    description: 'a function that should be run to register whether the user is explicitly confirmed a time for a call with the AI\'s company',
    parameters: {
        type: 'object',
        properties: {
            'lead_available_within_next_15': {
              type: 'boolean',
              description: `True if user is available to talk now or within the next 15 minutes (they agree to call without suggesting alternative time beyond 15 minutes from now), false if they are proposing a much later time for the call (e.g. "Sure, 1:30pm work?")`
            },
            'lead_confirms_specific_time': {
              type: 'boolean',
              description: `True only if user confirms a specific time. Needs to be more than just a day "I can do Friday", but a specific time, e.g. "I can do 8PM"`
            },
            'lead_confirms_timezone': {
              type: 'boolean',
              description: `True only if user confirms the time zone they are in"`
            },
            'lead_asking_for_call_relative_to_now': {
              type: 'boolean',
              description: `True only if user is requesting a call relative to now, e.g. "Can we talk in 15 minutes?" or "Can we talk in 2 hours?" False if they ask for a specific time, e.g. "Can we talk at 3PM?"`
            }
        },
        required: ["lead_available_within_next_15", 'lead_confirms_specific_time', "lead_confirms_timezone", "lead_asking_for_call_relative_to_now"]
    }
  }]

  let openToCallResult = await callGPTFunctionMultiArg(prompt, func, 'gpt-4');
  console.log(openToCallResult);
  return openToCallResult;
}



export const checkIfConfirmedAvo = async(transcript: string) => {
  let prompt = `Given the transcript, determine whether the user confirmed that they are consenting to receiving a call from a career advisor. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_live_career_advisor_call',
    description: 'a function that should be run to register whether the user is explicitly confirming to receive a call from a career advisor',
    parameters: {
        type: 'object',
        properties: {
            'career_advisor_mentioned': {
              type: 'boolean',
              description: 'True of the AI has explicitly mentioned the career advisor in the conversation'
            },
            'lead_available_within_next_15': {
              type: 'boolean',
              description: `True if user says they are available to talk now or within the next 15 minutes (they agree to call without suggesting alternative time beyond 15 minutes from now), false if they are proposing a much later time for the call (e.g. "Sure, 1:30pm work?")`
            }
        },
        required: ['career_advisor_mentioned',"lead_available_within_next_15"]
    }
  }]

  let openToCallResult = await callGPTFunctionMultiArg(prompt, func, 'gpt-4');
  console.log(openToCallResult);
  return openToCallResult;
}



// 'existing_text_convo': {
//   type: 'boolean',
//   description: `true/false depending on whether the user is suggesting they are currently having a text conversation with Jacob or a rep at the AI\'s company
//   Example input/output:
//   Input 1: "Are you texting me right now?", Output 1: true
//   Input 2: "Someone from your team says they are messaging me", Output 2: true
//   Input 3: "I want to apply to have you mentor me", Output 3: false,
//   Input 4: "I already applied", Output 4: true,
//   Input 5: "Hey are you doing mentorships?", Output 5: false,
//   Input 6: "Is [insert name] someone from your team?", Output 6: true,
//   `
// }


export const checkIfConfirmedCall = async(transcript: string) => {
  let prompt = `Given the transcript, determine whether the user confirmed that they are consenting to receiving a call from one of our execs at the AI\'s company. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_live_exec_call',
    description: 'a function that should be run to register whether the user is explicitly confirming to receive a call from one of our execs at the AI\'s company right now',
    parameters: {
        type: 'object',
        properties: {
            'exec_mentioned': {
              type: 'boolean',
              description: 'True of the AI has mentioned the exec in the conversation'
            },
            'lead_available_within_next_15': {
              type: 'boolean',
              description: `True if user is available to talk now or within the next 15 minutes (they agree to call without suggesting alternative time beyond 15 minutes from now), false if they are proposing a much later time for the call (e.g. "Sure, 1:30pm work?")
             Example input/output:
              Input 1: "Yes", Output 1: true
              Input 2: "I'm at work right now", Output 2: false
              Input 3: "Give me 15", Output 5: true,
              Input 4: "Im not free right today", Output 4: false,
              Input 5: "How about at 11:30", Output 3: false,              
              Input 6: "Yes, but in 30 minutes", Output 5: false`         
            },
            'lead_confirms_specific_time': {
              type: 'boolean',
              description: `True only if user confirms a specific time to speak with the executive. Needs to be more than just a day "I can do Friday", but a specific time, e.g. "I can do 8PM"`
            },
            'lead_confirms_timezone': {
              type: 'boolean',
              description: `True only if user confirms the time zone they are in"`
            },
            'lead_asking_for_call_relative_to_now': {
              type: 'boolean',
              description: `True only if user is requesting a call relative to now, e.g. "Can we talk in 15 minutes?" or "Can we talk in 2 hours?" False if they ask for a specific time, e.g. "Can we talk at 3PM?"`
            }
        },
        required: ['exec_mentioned',"lead_available_within_next_15", 'lead_confirms_specific_time', "lead_confirms_timezone", "lead_asking_for_call_relative_to_now"]
    }
  }]

  let openToCallResult = await callGPTFunctionMultiArg(prompt, func, 'gpt-4');
  console.log(openToCallResult);
  return openToCallResult;
}


export const checkIfConfirmedCallFT = async(transcript: string) => {
  let prompt = `Given the transcript, determine whether the user confirmed that they are consenting to receiving a call from a coach at the AI\'s company. \n TRANSCRIPT: ${transcript}`;

  const func: ChatAPIFunction[] = [{
    name: 'register_live_exec_call',
    description: 'a function that should be run to register whether the user is explicitly confirming to receive a call from a coach at the AI\'s company right now',
    parameters: {
        type: 'object',
        properties: {
            'confirming_to_receive_call_from_coach': {
                type: 'boolean',
                description: 'true/false depending on whether the user is explicitly confirming to receive a call from a coach at the AI\'s company '
            },
            'coach_mentioned': {
                type: 'boolean',
                description: 'true/false depending the AI has mentioned the coach'
            }
        },
        required: ["confirming_to_receive_call_from_coach", "coach_mentioned"]
    }
  }]

  let openToCallResult = await callGPTFunctionMultiArg(prompt, func);
  console.log(openToCallResult);
  return openToCallResult;
}




export const determineIfLeadWantsBackIn = async(transcript: string) => {
  let prompt = `Given the transcript, determine if the lead is stating that they can work with a minimum 1000 budget. \n TRANSCRIPT: ${transcript}`;
  const func: ChatAPIFunction[] = [{
    name: 'register_lead_budget',
    description: 'a function that should be run to register if the lead is stating that they are able to work with a minimum 1000 budget',
    parameters: {
        type: 'object',
        properties: {
            'lead_can_work_with_1000': {
                type: 'string',
                description: 'true/false depending on whether the lead is stating they are able to work with at least a 1000 budget'
            }
        },
        required: ["lead_can_work_with_1000"]
    }
  }]

  let amountResult = await callGPTFunction(prompt, func);
  return amountResult;
}



export const determineAmountLeadHas = async(transcript: string) => {
  let prompt = `Given the transcript, determine how much money the lead is stating they have to invest in their store. \n TRANSCRIPT: ${transcript}`;
  const func: ChatAPIFunction[] = [{
    name: 'register_lead_budget',
    description: 'a function that should be run to register the amount the lead has to invest in their store',
    parameters: {
        type: 'object',
        properties: {
            'lead_budget': {
                type: 'string',
                description: 'amount lead has to invest in their store'
            }
        },
        required: ["lead_budget"]
    }
  }]

  let amountResult = await callGPTFunction(prompt, func);
  return amountResult;
}


export const checkIfConfirmedVP = async(transcript: string) => {
  let prompt = `Given the transcript, determine whether the user confirmed that they are consenting to receiving a call from the VP at the AI\'s company  (consenting could mean that they are asking to be called at a later time). \n TRANSCRIPT: ${transcript}`;
  const func: ChatAPIFunction[] = [{
    name: 'register_consent_for_vp_call',
    description: 'a function that should be run to register whether the user is explicitly confirming to receive a call from the VP at the AI\'s company  (consenting could mean that they are asking to be called at a later time)',
    parameters: {
        type: 'object',
        properties: {
            'open_to_call_with_vp': {
                type: 'boolean',
                description: 'true/false depending on whether the user is explicitly confirming to receive a call from the VP at the AI\'s company  (consenting could mean that they are asking to be called at a later time)'
            }
        },
        required: ["open_to_call_with_vp"]
    }
  }]

  let openToCallResult = await callGPTFunction(prompt, func);
  return openToCallResult;
}


export const checkIfDisqualified = async(transcript: string) => {
    let prompt = `The following is a transcript of a conversation you have been having with a lead. \n TRANSCRIPT: ${transcript}`;
 
    const func: ChatAPIFunction[] = [{
      name: 'register_credit_score',
      description: 'a function that should be run to register whether the leads credit score if present in the message',
      parameters: {
          type: 'object',
          properties: {
              'credit_score_below_650': {
                  type: 'boolean',
                  description: 'true/false depending on whether the lead has a credit score below 650'
              }
          },
          required: ["credit_score_below_650"]
      }
    }]

    let disqResult = await callGPTFunction(prompt, func);
    return disqResult;
}

export const callZapierHook = async(messages: any[], webhook: string, phone: string, summary: string, meetingConfirmed: boolean, leadName: string, liveCall: boolean, alertMsg?: string, aiMentioned: boolean = false, leadMessage?: boolean, leadIgId?: string, leadUsername?: string, setterName?: String, disqualified?: boolean, outOut?: boolean, closerEmail?: string) => {
  let formattedTranscript = getHTMLTranscript(messages, leadName);

  let webhookData = {
    "phone": phone,
    "summary": summary,
    "meeting_confirmed": meetingConfirmed,
    "lead_name": leadName,
    "transcript": formattedTranscript,
    "live_call": liveCall,
    "alert_msg": alertMsg,
    "ai_mentioned": aiMentioned,
    "lead_message": leadMessage,
    "lead_ig_id": leadIgId,
    "lead_username": leadUsername,
    "setter_name": setterName,
    "disqualified": disqualified,
    "optout": outOut,
    "closer_email": closerEmail
  }
  return await fetch(webhook, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(webhookData),
  }).then((res) => res.json())
  .catch((err: any) => {
    console.log(err.message);
    return err;
  });
}

export const callZapierHookLeadDQ = async(webhook: string, phone: string, optOut?: boolean) => {

  let webhookData = {
    "phone": phone,
    "disqualified": true,
    "optout": optOut
  }
  return await fetch(webhook, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(webhookData),
  }).then((res) => res.json())
  .catch((err: any) => {
    console.log(err.message);
    return err;
  });
}

export const callZapierHookLeadDQIG = async(webhook: string, igId: string, optOut?: boolean) => {

  let webhookData = {
    "lead_ig_id": igId,
    "disqualified": true,
    "optout": optOut
  }
  return await fetch(webhook, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(webhookData),
  }).then((res) => res.json())
  .catch((err: any) => {
    console.log(err.message);
    return err;
  });
}


export const updateZapierDeadConvo = async(uid: string, docs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[], disqualified: boolean = false) => {
  const webhook = (await adminDb.collection('users').doc(uid).get()).data()!['zapier_hook'];
    for (let i = 0; i < docs.length; i++){

      let data = docs[i].data();
      console.log(data);
      let phoneNumber = docs[i].id;
      let convo = data.messages;

      let dataToUpdate: Record<string, any> = {}


      // call the webhook since the conversation is now dead
      if (webhook != undefined){
        let leadName = data.lead_name;

        let formattedTranscript = getHTMLTranscript(convo, leadName);

        let phone = phoneNumber.slice(1);
        let transcript = getTranscript(convo, leadName);
        let ai_mentioned = false;
        if (data.ai_mentioned == true){
          ai_mentioned = true;
        }


        let msgs: ChatAPICallMessage[] = [];
        let prompt = `You just had a conversation with a new lead, and your job now is to summarize the main points of what the lead, ${leadName}, said during the conversation in three sentences, so that we can send the report to the sales team\n ${transcript}`;
        console.log(prompt);
        msgs.push({role: 'user', content: prompt});
        // let respMessage = await chatCall(msgs, 'gpt-4')
        let respMessage = '';
        dataToUpdate['summary'] = respMessage;
        dataToUpdate['zapier_alerted'] = true;

        // send the webhook the meeting_confirmed or not, phone number, and summary
        let webhookData = {
          "phone": phone,
          "summary": respMessage,
          "meeting_confirmed": false,
          "lead_name": leadName,
          "transcript": formattedTranscript,
          "booking_status": 'dead',
          'disqualified': disqualified,
          "ai_mentioned": ai_mentioned
        }
        await fetch(webhook, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookData),
        }).catch((err: any) => console.log(err.message));

        await adminDb
        .collection('users')
        .doc(uid)
        .collection('convos')
        .doc(phoneNumber)
        .update(dataToUpdate);
       }
    }      
}