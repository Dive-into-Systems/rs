<h2>Assembly Mode</h2>

```xml
<div class="runestone">
    <div data-component="assembly_mode" data-question_label="1" id="test-assembly-mode-ia32-div" style="visibility: hidden;">
        <script type="application/json">
            {
                "architecture" : "ia_32",
                "q1" : ["nothing", false, false, "", false],
                "q2" : ["leal", false, false, "0x0", true],
                "q3" : ["read0", true, true, "0x0" , false],
                "q4" : ["write1", true, false, "0x1" , false],
                "r1Init" : "0x3",
                "r2Init" : "0x4",
                "allowAMA" : true
            }
        </script>
        <style>
            body {
            overflow-y: hidden;
            overflow-x: hidden;
            }
        </style>
    </div>
</div>
```

Looks like

<img width="462" height="1122" alt="image" src="https://github.com/user-attachments/assets/0bd8d0d7-74e5-43ee-88a4-7723dba97268" />


```xml
                    <div class="runestone">
                        <div data-component="assembly_mode" data-question_label="1" id="test-assembly-mode-ia32-div" style="visibility: hidden;">
                            <script type="application/json">
                                {
                                    "architecture" : "ia_32",
                                    "q1" : ["mov %eax 0x4(%eax)", false, false, "", false],
                                    "q2" : ["leal", false, false, "0x0", true],
                                    "q3" : ["read0", true, true, "0x0" , false],
                                    "q4" : ["instruction", true, false, "0x12" , false],
                                    "r1Init" : "0x7",
                                    "r2Init" : "0x1",
                                    "allowAMA" : false
                                }
                            </script>
                            <style>
                                body {
                                overflow-y: hidden;
                                overflow-x: hidden;
                                }
                            </style>
                        </div>
                    </div>
```
looks like


<img width="460" height="1088" alt="image" src="https://github.com/user-attachments/assets/f45d2abb-f93d-4bb3-ac35-99876d43a1d2" />


<h4>Parameters</h4>
<ul>
    <li>Architecture: This parameter must be specified for the component to work! This decides the architecture format of the question the three options are "X86_64", "ia_32", and "ARM64".</li>
</ul>

Question parameters follow the following format: ["text of instruction", memory access? (bool, true if yes), read/wrtie? (true if read), "answer (with 0x behind it)", leal?(true if lea(l), false for everything else)

Rest of the parameters

<ul>
    <li>q1 - q4: array of the values following above format. There must be four of these</li>
    <li>r1Init: the initial value of register 1</li>
    <li>r2Init: the initial value of register 2</li>
    <li>allowAMA: true if the user is allowed to generate new questions afterwards</li>
</ul>


