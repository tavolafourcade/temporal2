


export const sendIMSG = (recipient: string, message: string, sendBlue: boolean, from_id?: string, media_url?: string) => {
    if (!sendBlue && from_id != undefined){
        return sendImsg(recipient, message, from_id);
    } else {
        return sendBlueMSG(recipient, message, from_id, media_url);
    }
}


export const sendTypingIndicator = (recipient: string) => {
    let promise;
    promise = fetch('https://api.sendblue.co/api/send-typing-indicator', {
            method: 'POST',
            headers: {
                'sb-api-key-id': process.env.SENDBLUE_API_KEY,
                'sb-api-secret-key': process.env.SENDBLUE_SECRET,
                'content-type': 'application/json'
            } as any,
            body: JSON.stringify({
                number: recipient,
            })
        })
    return promise;


}

export const sendVoiceMemo = (recipient: string, message: string, from_number?: string, media_url?: string, extra_nums?: string[], group_id?: string, sendStyle?: string) => {
    let promise;
    const formData = new URLSearchParams();
    formData.append('number', recipient);

    let body: Record<string,string> = {number: recipient}
    if (from_number != undefined){
        formData.append('from_number', from_number);
    }
    if (media_url != undefined){
        formData.append('media_url', media_url);
    }
    formData.append('status_callback', process.env.NEXT_STATIC_URL + '/api/sb_status_callback');

    promise = fetch('https://api.sendblue.co/api/send-message', {
            method: 'POST',
            headers: {
                'sb-api-key-id': process.env.SENDBLUE_API_KEY,
                'sb-api-secret-key': process.env.SENDBLUE_SECRET,
                'content-type': 'application/x-www-form-urlencoded',
            } as any,
            body: formData
        })
    return promise;


}

export const sendGroupIMSG = (recipient: string, message: string, from_number?: string, media_url?: string, extra_nums?: string[], group_id?: string, sendStyle?: string) => {
    let promise;
    let body: Record<string,any> = {content: message}

    if (group_id != undefined){
        body['group_id'] = group_id;
    } else {
        if (extra_nums != undefined){
            body['numbers'] = [recipient].concat(extra_nums); 
        } else {
            body['number'] = recipient;
        }
    }

    if (sendStyle != undefined){
        body['send_style'] = sendStyle;
    }


    console.log(body);

    if (from_number != undefined){
        body['from_number'] = from_number;
    }
    if (media_url != undefined){
        body['media_url'] = media_url;
    }
    body['status_callback'] = process.env.NEXT_STATIC_URL + '/api/status_callback'
    console.log(body);
    let url = 'https://api.sendblue.co/api/send-message'
    if (extra_nums != undefined){
        url = 'https://api.sendblue.co/api/send-group-message'
    }
    promise = fetch(url, {
            method: 'POST',
            headers: {
                'sb-api-key-id': process.env.SENDBLUE_API_KEY,
                'sb-api-secret-key': process.env.SENDBLUE_SECRET,
                'content-type': 'application/json',
            } as any,
            body: JSON.stringify(body)
        })
    return promise;


}



export const sendBlueMSG = (recipient: string, message: string, from_number?: string, media_url?: string, sendStyle?: string) => {
    let promise;
    let body: Record<string,string> = {number: recipient, content: message}
    if (from_number != undefined){
        body['from_number'] = from_number;
    }
    if (media_url != undefined){
        body['media_url'] = media_url;
    }
    if (sendStyle != undefined){
        body['send_style'] = sendStyle;
    }
    body['status_callback'] = process.env.NEXT_STATIC_URL + '/api/status_callback'
    console.log(body);
    promise = fetch('https://api.sendblue.co/api/send-message', {
            method: 'POST',
            headers: {
                'sb-api-key-id': process.env.SENDBLUE_API_KEY,
                'sb-api-secret-key': process.env.SENDBLUE_SECRET,
                'content-type': 'application/json',
            } as any,
            body: JSON.stringify(body)
        })
    return promise;


}

export const sendImsg = async(recipient: string, message: string, from_id: string, reaction?: string, message_id?: string) => {
    let promise;
    if (reaction != undefined && reaction == 'love'){
        promise = fetch('https://server.loopmessage.com/api/v1/message/send', {
            method: 'POST',
            headers: {
                'Authorization': '4HIGDNT66-5M0COY16P-2DCS3BG0Y-AOS3VP72A',
                'Loop-Secret-Key': 'F3KfalUfmNrvDA1a_4OmPcxK6xoA83rDMZ5_uk-NiyYWXmlik1loyzOfDMCIH7Z6',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipient: recipient,
                sender_name: from_id,
                message_id: message_id,
                reaction: 'love'
            })
        })
    } else {

        promise = fetch('https://server.loopmessage.com/api/v1/message/send', {
            method: 'POST',
            headers: {
                'Authorization': '4HIGDNT66-5M0COY16P-2DCS3BG0Y-AOS3VP72A',
                'Loop-Secret-Key': 'F3KfalUfmNrvDA1a_4OmPcxK6xoA83rDMZ5_uk-NiyYWXmlik1loyzOfDMCIH7Z6',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipient: recipient,
            text: message,
                sender_name: from_id,
            })
        })
    }
    return promise;
}
  
export const sendTwilioSMS = async(client: any, recipient: string, message: string, from_phone: string) => {
    const promise = client.messages
    .create({
      body: message,
      from: from_phone,
      to: recipient,
      statusCallback: process.env.NEXT_STATIC_URL +  '/api/twil_status_callback',
      
    })
    return promise;
}


export const findLeadInClose = async(phone: string, apikey: string) => {
    let data = {
        "limit": null,
        "query": {
            "negate": false,
            "queries": [
                {
                    "negate": false,
                    "object_type": "lead",
                    "type": "object_type"
                },
                {
                    "mode": "beginning_of_words",
                    "negate": false,
                    "type": "text",
                    "value": phone
                },
                {
                    "negate": false,
                    "queries": [],
                    "type": "and"
                }
            ],
            "type": "and"
        },
        "results_limit": null,
        "sort": []
    }
    
    const promise =  fetch('https://api.close.com/api/v1/data/search/', {        
        method: 'POST',
        headers: {
                'Accept': 'application/json',
                'Authorization': `Basic ${btoa(apikey + ':')}`
            },
        body: JSON.stringify(data),
        })
        
    return promise;


}

export const sendMessageToClose = async(message: string, leadId: string,  leadPhone: string, bizPhone: string, event: string, apikey: string) => {
    let data = {
        "status": event,
        "text": message,
        "remote_phone": leadPhone,
        "local_phone": bizPhone,
        "source": "External",
        "lead_id": leadId,
    }
    const promise =  fetch('https://api.close.com/api/v1/activity/sms/', {
        method: 'POST',
        
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Basic ${btoa(apikey + ':')}`

        },
        body: JSON.stringify(data),
      })
    return promise;


}

export const sendWebhookToCRM = async(message: string, phone: string, event: string) => {

    let data = {
        "event": event,
        "data": {
          "message": {
            "body": message
          },
        "contact": {
          "number": phone
          }
        }
      }


    const promise =  fetch('https://meg55rzt16.execute-api.us-east-1.amazonaws.com/8mR4evrGRhrmH2giGaieofy0DXiQmy9GkA24ASE0pn0', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })
    return promise;
}