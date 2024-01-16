import keyboard
import time

def main():
   # Initialize the list to store typed characters
   typed_words = []

   # Record key presses until 1.5 minutes have passed
   start_time = time.time()
   while time.time() - start_time <= 90: # 90 seconds equals 1.5 minutes
       # Wait for a key event
       event = keyboard.read_event()

       # Check if the event was a key press
       if event.event_type == keyboard.KEY_DOWN:
           # Append the character to the list
           typed_words.append(event.name)

   # Convert the list to a string and return it
   return ' '.join(typed_words)
