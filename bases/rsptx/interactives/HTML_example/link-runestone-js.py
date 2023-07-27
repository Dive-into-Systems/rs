#!/usr/bin/env python3

import os.path
import sys

import json

# Verify the number of params, print usage.
if len(sys.argv) < 3:
    print(f'Usage: {sys.argv[0]} <path/to/webpack_static_imports.json> <path/to/html/file>')
    sys.exit(1)

# Get args.
json_path = sys.argv[1]
html_path = sys.argv[2]

json_dirname = os.path.dirname(json_path)
html_dirname = os.path.dirname(html_path)

if len(html_dirname) > 0:
    print('HTML file must be in the directory you\'re running this script within.')
    sys.exit(1)

# Open the JSON file.  It should produce a dictionary with two keys:
#   'js': list of JS files
#   'css': list of CSS files
# We need to load all of them into the HTML file's headers.
with open(json_path, 'r') as json_file:
    json_contents = json.load(json_file)

print('JS files:')
for js in json_contents['js']:
    print(js)

print('CSS files:')
for css in json_contents['css']:
    print(css)

with open(html_path, 'r') as html_file:
    html_data = html_file.readlines()

found_begin = False
found_end = False

with open(html_path, 'w') as html_file:
    for line in html_data:
        if 'BEGIN LINKED FILES' in line:
            # We've reached the beginning.
            found_begin = True
            html_file.write('    <!-- BEGIN LINKED FILES -->\n')
        elif 'END LINKED FILES' in line:
            # We've reached the end.
            found_end = True

            for css in json_contents['css']:
                html_file.write(f'    <link rel="stylesheet" type="text/css" href="{json_dirname}/{css}" />\n')

            for js in json_contents['js']:
                html_file.write(f'    <script src="{json_dirname}/{js}"></script>\n')
            
            # add script for MathJax
            
            # html_file.write('    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>')
            # html_file.write('    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>\n')
            # html_file.write("    <script>MathJax = {tex: {inlineMath: [['$', '$'], ['\\(', '\\)']]}}; </script>\n")
            html_file.write('    <!-- END LINKED FILES -->\n')
        elif not found_begin:
            # We're before the linked files section -- write the line as-is
            html_file.write(line)
        elif found_begin and not found_end:
            # The line is from a previous linked file, exclude it
            pass
        elif found_begin and found_end:
            # We're past the linked files section -- write the line as-is
            html_file.write(line)
