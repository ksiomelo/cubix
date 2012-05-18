#!/usr/bin/env python
import pika
import time
import json
import StringIO
#from fca.concept import Concept
from casa import Casa
#from fca.readwrite import cxt

def read_cxt_string(data):
    input_file = StringIO.StringIO(data)

    assert input_file.readline().strip() == "B",\
        "File is not valid cxt"
    input_file.readline() # Empty line
    number_of_objects = int(input_file.readline().strip())
    number_of_attributes = int(input_file.readline().strip())
    input_file.readline() # Empty line

    objects = [input_file.readline().strip() for i in xrange(number_of_objects)]
    attributes = [input_file.readline().strip() for i in xrange(number_of_attributes)]

    table = []
    for i in xrange(number_of_objects):
        line = map(lambda c: c=="X", input_file.readline().strip())
        table.append(line)

    input_file.close()

    return Casa("sample", objects, attributes, table)



def get_a_context():
    title = "sample context"
    objects = [1, 2, 3, 4]
    attributes = ['a', 'b', 'c', 'd']
    rels = [[True, False, False, True],\
              [True, False, True, False],\
              [False, True, True, False],\
              [False, True, True, True]]
    return Casa(title,objects,attributes,rels)

def on_queue_declared(queue):
    channel.queue_bind(queue='test', 
                   exchange='', 
                   routing_key='order.test.customer')
    

connection = pika.BlockingConnection(pika.ConnectionParameters(
        host='localhost'))
channel = connection.channel()

channel.queue_declare(queue='task_queue', durable=True, exclusive=False)
channel.queue_declare(queue='msg_queue', durable=True, exclusive=False)


#channel.exchange_declare(exchange='', 
#                         type="topic", 
#                         durable=True, 
#                         auto_delete=False)

#channel.queue_declare(queue="task_queue", 
#                      durable=True, 
#                      exclusive=False, 
#                      auto_delete=False, 
#                      callback=on_queue_declared)



print ' [*] Waiting for messages. To exit press CTRL+C'


def msg_callback(ch, method, props, body):
    print " [x] Received %r" % (body,)
    response = body + " MODIFIED"
    
    #response = get_a_concept()
    print " [x] Done"
    ch.basic_publish(exchange='',
                     routing_key=props.reply_to,
                     properties=pika.BasicProperties(correlation_id = \
                                                     props.correlation_id),
                     body= str(response))
    ch.basic_ack(delivery_tag = method.delivery_tag)



def callback(ch, method, props, body):
    print " [x] Received %r" % (body,)
    response = body + " MODIFIED"
    
    context = read_cxt_string(body)
    
    print context.to_dict(False)
    
    #response = get_a_concept()
    print " [x] Done"
    ch.basic_publish(exchange='',
                     routing_key=props.reply_to,
                     properties=pika.BasicProperties(correlation_id = \
                                                     props.correlation_id),
                     body= json.dumps(context.to_dict(False)))#str(response))
    ch.basic_ack(delivery_tag = method.delivery_tag)

channel.basic_qos(prefetch_count=1)
channel.basic_consume(callback,
                      queue='task_queue')
channel.basic_consume(msg_callback,
                      queue='msg_queue')

channel.start_consuming()