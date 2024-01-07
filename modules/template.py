import requests
#import libraries you want to use. The coad loader will attempt to dynamically install libraries it does not find on the target machine.

#the main() function is not strictly necessary, but to return data to the operator, you need it.
#If you do not wish to return anything, feel free to exclude this function.

def main():
    print("Text will not be shown to the operator.") # text printed will not be shown to the operator (the person operating the bot). However the code will be executed regardless.

    return "This text will be seen by the operaotr." # text returned by the main() function will be seen by the operator.
