'''
Created on Apr 27, 2012

@author: cassiomelo

FROM : http://stackoverflow.com/questions/7564052/what-is-the-best-way-to-send-messages-to-socket-io-clients-from-various-back-end
'''

import pika

AMQP_SETTINGS = {
   'host' :  'localhost',
   'port' :  '',
   'username' :  'guest',
   'pass' :  'guest'
}

exchange_name = ""

NODE_CHANNEL = ""

def amqp_transmit(message):
    
    connection = pika.AsyncoreConnection(pika.ConnectionParameters(host=AMQP_SETTINGS['host']))
    channel = connection.channel()
    channel.exchange_declare(exchange=exchange_name, type='direct')
    channel.queue_declare(queue=NODE_CHANNEL, auto_delete=True, durable=False, exclusive=False)
    channel.basic_publish(exchange=exchange_name,
            routing_key='',
            body=message + " MODIF",
            properties=pika.BasicProperties(
                    content_type='application/json'),
            )
    print ' [%s] Sent %r' %(exchange_name, message)
    connection.close()
