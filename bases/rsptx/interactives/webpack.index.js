// ***********************************************************************************
// |docname| - A framework allowing a Runestone component to load only the JS it needs
// ***********************************************************************************
// The JavaScript required by all Runestone components is quite large and results in slow page loads. This approach enables a Runestone component to load only the JavaScript it needs, rather than loading JavaScript for all the components regardless of which are actually used.
//
// To accomplish this, webpack's split-chunks ability analyzes all JS, starting from this file. The dynamic imports below are transformed by webpack into the dynamic fetches of just the JS required by each file and all its dependencies. (If using static imports, webpack will assume that all files are already statically loaded via script tags, defeating the purpose of this framework.)
//
// However, this approach leads to complexity:
//
// -    The ``data-component`` attribute of each component must be kept in sync with the keys of the ``module_map`` below.
// -    The values in the ``module_map`` must be kept in sync with the JavaScript files which implement each of the components.

// Static imports
// ==============
// These imports are (we assume) needed by all pages. However, it would be much better to load these in the modules that actually use them.
//
// These are static imports; code in `dynamically loaded components`_ deals with dynamic imports.
//
// jQuery-related imports.
import "jquery-ui/jquery-ui.js";
import "jquery-ui/themes/base/jquery.ui.all.css";
import "./runestone/common/js/jquery.idle-timer.js";
import "./runestone/common/js/jquery_i18n/jquery.i18n.js";
import "./runestone/common/js/jquery_i18n/jquery.i18n.emitter.bidi.js";
import "./runestone/common/js/jquery_i18n/jquery.i18n.emitter.js";
import "./runestone/common/js/jquery_i18n/jquery.i18n.fallbacks.js";
import "./runestone/common/js/jquery_i18n/jquery.i18n.messagestore.js";
import "./runestone/common/js/jquery_i18n/jquery.i18n.parser.js";
import "./runestone/common/js/jquery_i18n/jquery.i18n.language.js";

// Bootstrap
import "bootstrap/dist/js/bootstrap.js";
// comment out for overhaul
//import "bootstrap/dist/css/bootstrap.css";
import "./ptxrs-bootstrap.less";
import "./runestone/common/project_template/_templates/plugin_layouts/sphinx_bootstrap/static/bootstrap-sphinx.js";
// comment out for overhaul
//import "./runestone/common/css/runestone-custom-sphinx-bootstrap.css";

// Misc
import "./runestone/common/js/bookfuncs.js";
import "./runestone/common/js/user-highlights.js";
import "./runestone/common/js/pretext.js";

// These belong in dynamic imports for the obvious component; however, these components don't include a ``data-component`` attribute.
import "./runestone/matrixeq/css/matrixeq.css";
import "./runestone/webgldemo/css/webglinteractive.css";

// These are only needed for the Runestone book, but not in a library mode (such as pretext). I would prefer to dynamically load them. However, these scripts are so small I haven't bothered to do so.
import { getSwitch, switchTheme } from "./runestone/common/js/theme.js";
import "./runestone/common/js/presenter_mode.js";
import "./runestone/common/css/presenter_mode.css";
import { renderOneComponent } from "./runestone/common/js/renderComponent.js";

// Dynamically loaded components
// =============================
// This provides a list of modules that components can dynamically import. Webpack will create a list of imports for each based on its analysis.
const module_map = {
    // Wrap each import in a function, so that it won't occur until the function is called. While something cleaner would be nice, webpack can't analyze things like ``import(expression)``.
    //
    // The keys must match the value of each component's ``data-component`` attribute -- the ``runestone_import`` and ``runestone_auto_import`` functions assume this.
    activecode: () => import("./runestone/activecode/js/acfactory.js"),
    ble: () => import("./runestone/cellbotics/js/ble.js"),
    // Always import the timed version of a component if available, since the timed components also define the component's factory and include the component as well. Note that ``acfactory`` imports the timed components of ActiveCode, so it follows this pattern.
    clickablearea: () =>
        import("./runestone/clickableArea/js/timedclickable.js"),
    codelens: () => import("./runestone/codelens/js/codelens.js"),
    datafile: () => import("./runestone/datafile/js/datafile.js"),
    dragndrop: () => import("./runestone/dragndrop/js/timeddnd.js"),
    fillintheblank: () => import("./runestone/fitb/js/timedfitb.js"),
    numberconversion: () => import("./runestone/numconv/js/numconv.js"),
    assembly_syntax: () => import("./runestone/assembly/js/assembly.js"),
    assembly_state: () => import("./runestone/assembly/js/assembly_state.js"),
    assembly_flag: () => import("./runestone/assembly/js/assembly_flag.js"),
    assembly_jump: () => import("./runestone/assembly/js/assembly_jump.js"),
    assembly_mode: ()=> import("./runestone/assembly/js/assembly_mode.js"),
    binops: () => import("./runestone/numconv/js/binops.js"),
    bincalc: () => import("./runestone/numconv/js/bincalc.js"),
    binarith: () => import("./runestone/numconv/js/binarith.js"),
    binselect: () => import("./runestone/numconv/js/binselect.js"),
    cachetable: () => import("./runestone/cache/js/cachetable.js"),
    cacheinfo: () => import("./runestone/cache/js/cacheinfo.js"),
    cachepartition: () => import("./runestone/cache/js/cachepartition.js"),
    // circuittruth: () => import("./runestone/circuit/js/circuittruth.js"),
    test_circuittruth: () => import("./runestone/circuit/js/test_circuittruth.js"),
    vo: () => import("./runestone/virtualmemory/js/vo.js"),
    vmtable: () => import("./runestone/virtualmemory/js/vmtable.js"),
    vminfo: () => import("./runestone/virtualmemory/js/vminfo.js"),
    vmpartition: () => import("./runestone/virtualmemory/js/vmpartition.js"),
    groupsub: () => import("./runestone/groupsub/js/groupsub.js"),
    khanex: () => import("./runestone/khanex/js/khanex.js"),
    lp_build: () => import("./runestone/lp/js/lp.js"),
    multiplechoice: () => import("./runestone/mchoice/js/timedmc.js"),
    hparsons: () => import("./runestone/hparsons/js/hparsons.js"),
    parsons: () => import("./runestone/parsons/js/timedparsons.js"),
    poll: () => import("./runestone/poll/js/poll.js"),
    processHierarchy: () => import("./runestone/operatingsystem/processHierarchy/js/fork-hierarchy.js"),
    processTimeline: () => import("./runestone/operatingsystem/processHierarchy/js/fork-timeline.js"),
    quizly: () => import("./runestone/quizly/js/quizly.js"),
    reveal: () => import("./runestone/reveal/js/reveal.js"),
    selectquestion: () => import("./runestone/selectquestion/js/selectone.js"),
    shortanswer: () =>
        import("./runestone/shortanswer/js/timed_shortanswer.js"),
    showeval: () => import("./runestone/showeval/js/showEval.js"),
    simple_sensor: () => import("./runestone/cellbotics/js/simple_sensor.js"),
    spreadsheet: () => import("./runestone/spreadsheet/js/spreadsheet.js"),
    tabbedStuff: () => import("./runestone/tabbedStuff/js/tabbedstuff.js"),
    threading_race: () => import("./runestone/threading/js/threading_race.js"),
    threading_mutex: ()=>import("./runestone/threading/js/threading_mutex.js"),
    timedAssessment: () => import("./runestone/timed/js/timed.js"),
    wavedrom: () => import("./runestone/wavedrom/js/wavedrom.js"),
    // TODO: since this isn't in a ``data-component``, need to trigger an import of this code manually.
    webwork: () => import("./runestone/webwork/js/webwork.js"),
    youtube: () => import("./runestone/video/js/runestonevideo.js"),
    drawCircuit: ()=> import("./runestone/circuit/js/drawCircuit.js"),
    circuitVis: ()=> import("./runestone/circuit/js/circuitVis.js"),

};

const module_map_cache = {};
const QUEUE_FLUSH_TIME_MS = 10;
const queue = []
let queueLastFlush = 0;
/**
 * Queue imports that are requested within `QUEUE_FLUSH_TIME_MS` of each other.
 * All such imports are imported at once, and then a promise is fired after all
 * the imports in the queue window have completed.
 */
function queueImport(component_name) {
    let resolve = null;
    let reject = null;
    const retPromise = new Promise((r, rej) => {resolve = r; reject = rej})
    const item = {component_name, resolve, reject};
    queue.push(item);
    window.setTimeout(flushQueue, QUEUE_FLUSH_TIME_MS + 1);

    return retPromise;
}
async function flushQueue() {
    if (queue.length === 0) {
        return
    }
    if (Date.now() - queueLastFlush < QUEUE_FLUSH_TIME_MS) {
        window.setTimeout(flushQueue, QUEUE_FLUSH_TIME_MS + 1);
        return;
    }
    // If we made it here, it has been at least QUEUE_FLUSH_TIME_MS since
    // the last time we flushed the queue. Therefore, we should start flushing.
    // We copy everything we flush and empty the array first.
    queueLastFlush = Date.now();
    const toFlush = [...queue];
    queue.length = 0;
    console.log("Webpack is starting the loading process for the following Runestone modules", toFlush.map(item => item.component_name));
    const flushedPromise = toFlush.map(async (item) => {
        try {
            await module_map[item.component_name]();
            return item;
        } catch(e) {
            item.reject(e);
        }
    })
    const flushed = await Promise.all(flushedPromise);
    flushed.forEach(item => item.resolve());
}

// .. _dynamic import machinery:
//
// Dynamic import machinery
// ========================
// Fulfill a promise when the Runestone pre-login complete event occurs.
let pre_login_complete_promise = new Promise((resolve) =>
    $(document).on("runestone:pre-login-complete", resolve)
);
let loadedComponents;
// Provide a simple function to import the JS for all components on the page.
export function runestone_auto_import() {
    // Create a set of ``data-component`` values, to avoid duplication.
    const s = new Set(
        // All Runestone components have a ``data-component`` attribute.
        $("[data-component]")
            .map(
                // Extract the value of the data-component attribute.
                (index, element) => $(element).attr("data-component")
                // Switch from a jQuery object back to an array, passing that to the Set constructor.
            )
            .get()
    );
    // webwork questions are not wrapped in div with a data-component so we have to check a different way
    if (document.querySelector(".webwork-button")) {
        s.add("webwork");
    }

    // Load JS for each of the components found.
    const a = [...s].map((value) =>
        // If there's no JS for this component, return an empty Promise.
        (module_map[value] || (() => Promise.resolve()))()
    );

    // Send the Runestone login complete event when all JS is loaded and the pre-login is also complete.
    Promise.all([pre_login_complete_promise, ...a]).then(function () {
        if (!document.body.dataset.reactInUse) {
            $(document).trigger("runestone:login-complete");
        }
    });
}

// Load component JS when the document is ready.
$(document).ready(runestone_auto_import);

// Provide a function to import one specific `Runestone` component.
// the import function inside module_map is async -- runestone_import
// should be awaited when necessary to ensure the import completes
export async function runestone_import(component_name) {
    if (module_map_cache[component_name]) {
        return module_map_cache[component_name];
    }
    const promise = queueImport(component_name);
    module_map_cache[component_name] = promise;
    return promise;
}

async function popupScratchAC() {
    // load the activecode bundle
    await runestone_import("activecode");
    // scratchDiv will be defined if we have already created a scratch
    // activecode.  If its not defined then we need to get it ready to toggle
    if (!eBookConfig.scratchDiv) {
        window.ACFactory.createScratchActivecode();
        let divid = eBookConfig.scratchDiv;
        window.componentMap[divid] = ACFactory.createActiveCode(
            $(`#${divid}`)[0],
            eBookConfig.acDefaultLanguage
        );
        if (eBookConfig.isLoggedIn) {
            window.componentMap[divid].enableSaveLoad();
        }
    }
    window.ACFactory.toggleScratchActivecode();
}

// Set the directory containing this script as the `path <https://webpack.js.org/guides/public-path/#on-the-fly>`_ for all webpacked scripts.
const script_src = document.currentScript.src;
__webpack_public_path__ = script_src.substring(
    0,
    script_src.lastIndexOf("/") + 1
);

// Manual exports
// ==============
// Webpack's ``output.library`` setting doesn't seem to work with the split chunks plugin; do all exports manually through the ``window`` object instead.

const rc = {};
rc.runestone_import = runestone_import;
rc.runestone_auto_import = runestone_auto_import;
rc.getSwitch = getSwitch;
rc.switchTheme = switchTheme;
rc.popupScratchAC = popupScratchAC;
rc.renderOneComponent = renderOneComponent;
window.componentMap = {};
window.runestoneComponents = rc;
