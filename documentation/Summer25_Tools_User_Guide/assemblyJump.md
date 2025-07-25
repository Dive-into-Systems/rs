<h1>Assembly Jump </h1

This component is designed to help students gain a functional understanding of how jumps in assembly work.
Here is an example of a prepopulated component 

```xml
<div data-component="assembly_jump" data-question_label="1" id="test-assembly-jump-ia32-div" style="visibility: hidden;">
      <script type="application/json">
          {
            "architecture" : "ia_32",
            "instructions" : "I am code! I am code I am code!",
            "mode" : 2,
            "jumpTaken" : false,
            "allowAMA" : true,
            "r1InitVal" : 4,
            "r2InitVal" : 2,
            "r1Val" : 3,
            "r2Val" : 3
            

          }
      </script>
      <style>
              body {
              overflow-y: hidden;
              overflow-x: hidden;
              }
      </style>
</div>
```

Produces a result that looks like this:
<img width="690" height="711" alt="image" src="https://github.com/user-attachments/assets/a7f41a62-e40b-4a17-bd81-a23ee1d31152" />


Similarly, 

```xml
<div data-component="assembly_jump" data-question_label="1" id="test-assembly-jump-ia32-div" style="visibility: hidden;">
      <script type="application/json">
          {
            "architecture" : "ia_32",
            "instructions" : "I am code! &#60;br&#62; I am code &#60;br&#62; I am code!",
            "mode" : 1,
            "jumpTaken" : false,
            "allowAMA" : false,
            "r1InitVal" : 4,
            "r2InitVal" : 2,
            "r1Val" : 3,
            "r2Val" : 3
            

          }
      </script>
      <style>
              body {
              overflow-y: hidden;
              overflow-x: hidden;
              }
      </style>
</div>
```

looks like this when rendered

<img width="690" height="673" alt="image" src="https://github.com/user-attachments/assets/afb95eae-0a24-4e9f-8a4f-6f0d50f11ec2" />

<h4>Parameters:</h4>

<ol>
  <li> architecture: You should definetly specify this, regardless of whether you want to prepopulate the question or not. There are three options so far: "X86_64", "ia_32", and "ARM64". This decides the ISA that the component will use. All other parameters are only needed
  for prepopulation.</li>
  <li>instructions: The text you want to have in the text box. As in example two, we need special characters to reperesent break tags. /n does not work. </li>
  <li>mode: which mode should the prepopulated question be in? Either 1 or 2</li>
  <li>jumpTaken: only necessary if mode=1. This is the answer to the question: a true or false value representing whether or not the jump gets taken.</li>
  <li>allowAMA: true if the user can generate new questions afterwards</li>
  <li>r1InitVal: the initial value in register 1</li>
  <li>r2InitVal: the initial value of register 2</li>
  <li>r1Val: This is only necessary if mode = 2. It is the final value of register 1</li>
  <li>r2Val: Only necessary in mode 2. The final value of register 2</li>
</ol>
