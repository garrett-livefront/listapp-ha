/*!
 * listapp-list-card — ListApp list card for Home Assistant.
 * Source and licences: https://github.com/garrett-livefront/listapp-ha (frontend/, NOTICE)
 * Bundles lit 3.3.3 (BSD-3-Clause) and icon paths from lucide (ISC).
 */
var Se=Object.defineProperty;var Ie=Object.getOwnPropertyDescriptor;var x=(s,e,t,i)=>{for(var r=i>1?void 0:i?Ie(e,t):e,n=s.length-1,o;n>=0;n--)(o=s[n])&&(r=(i?o(e,t,r):o(r))||r);return i&&r&&Se(e,t,r),r};var Q=globalThis,X=Q.ShadowRoot&&(Q.ShadyCSS===void 0||Q.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,gt=Symbol(),It=new WeakMap,j=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==gt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(X&&e===void 0){let i=t!==void 0&&t.length===1;i&&(e=It.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&It.set(t,e))}return e}toString(){return this.cssText}},Rt=s=>new j(typeof s=="string"?s:s+"",void 0,gt),ft=(s,...e)=>{let t=s.length===1?s[0]:e.reduce((i,r,n)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+s[n+1],s[0]);return new j(t,s,gt)},Pt=(s,e)=>{if(X)s.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let i=document.createElement("style"),r=Q.litNonce;r!==void 0&&i.setAttribute("nonce",r),i.textContent=t.cssText,s.appendChild(i)}},_t=X?s=>s:s=>s instanceof CSSStyleSheet?(e=>{let t="";for(let i of e.cssRules)t+=i.cssText;return Rt(t)})(s):s;var{is:Re,defineProperty:Pe,getOwnPropertyDescriptor:He,getOwnPropertyNames:Ue,getOwnPropertySymbols:De,getPrototypeOf:Le}=Object,tt=globalThis,Ht=tt.trustedTypes,Ne=Ht?Ht.emptyScript:"",Oe=tt.reactiveElementPolyfillSupport,F=(s,e)=>s,q={toAttribute(s,e){switch(e){case Boolean:s=s?Ne:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,e){let t=s;switch(e){case Boolean:t=s!==null;break;case Number:t=s===null?null:Number(s);break;case Object:case Array:try{t=JSON.parse(s)}catch{t=null}}return t}},et=(s,e)=>!Re(s,e),Ut={attribute:!0,type:String,converter:q,reflect:!1,useDefault:!1,hasChanged:et};Symbol.metadata??=Symbol("metadata"),tt.litPropertyMetadata??=new WeakMap;var T=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Ut){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let i=Symbol(),r=this.getPropertyDescriptor(e,i,t);r!==void 0&&Pe(this.prototype,e,r)}}static getPropertyDescriptor(e,t,i){let{get:r,set:n}=He(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:r,set(o){let a=r?.call(this);n?.call(this,o),this.requestUpdate(e,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Ut}static _$Ei(){if(this.hasOwnProperty(F("elementProperties")))return;let e=Le(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(F("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(F("properties"))){let t=this.properties,i=[...Ue(t),...De(t)];for(let r of i)this.createProperty(r,t[r])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[i,r]of t)this.elementProperties.set(i,r)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let r=this._$Eu(t,i);r!==void 0&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let i=new Set(e.flat(1/0).reverse());for(let r of i)t.unshift(_t(r))}else e!==void 0&&t.push(_t(e));return t}static _$Eu(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Pt(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){let i=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,i);if(r!==void 0&&i.reflect===!0){let n=(i.converter?.toAttribute!==void 0?i.converter:q).toAttribute(t,i.type);this._$Em=e,n==null?this.removeAttribute(r):this.setAttribute(r,n),this._$Em=null}}_$AK(e,t){let i=this.constructor,r=i._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let n=i.getPropertyOptions(r),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:q;this._$Em=r;let a=o.fromAttribute(t,n.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,i,r=!1,n){if(e!==void 0){let o=this.constructor;if(r===!1&&(n=this[e]),i??=o.getPropertyOptions(e),!((i.hasChanged??et)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:r,wrapped:n},o){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),n!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),r===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[r,n]of this._$Ep)this[r]=n;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[r,n]of i){let{wrapped:o}=n,a=this[r];o!==!0||this._$AL.has(r)||a===void 0||this.C(r,void 0,n,a)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};T.elementStyles=[],T.shadowRootOptions={mode:"open"},T[F("elementProperties")]=new Map,T[F("finalized")]=new Map,Oe?.({ReactiveElement:T}),(tt.reactiveElementVersions??=[]).push("2.1.2");var bt=globalThis,Dt=s=>s,it=bt.trustedTypes,Lt=it?it.createPolicy("lit-html",{createHTML:s=>s}):void 0,yt="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,xt="?"+M,Ve=`<${xt}>`,H=document,W=()=>H.createComment(""),G=s=>s===null||typeof s!="object"&&typeof s!="function",$t=Array.isArray,jt=s=>$t(s)||typeof s?.[Symbol.iterator]=="function",vt=`[ 	
\f\r]`,K=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Nt=/-->/g,Ot=/>/g,R=RegExp(`>|${vt}(?:([^\\s"'>=/]+)(${vt}*=${vt}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Vt=/'/g,zt=/"/g,Ft=/^(?:script|style|textarea|title)$/i,At=s=>(e,...t)=>({_$litType$:s,strings:e,values:t}),m=At(1),qt=At(2),$i=At(3),v=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),Bt=new WeakMap,P=H.createTreeWalker(H,129);function Kt(s,e){if(!$t(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return Lt!==void 0?Lt.createHTML(e):e}var Wt=(s,e)=>{let t=s.length-1,i=[],r,n=e===2?"<svg>":e===3?"<math>":"",o=K;for(let a=0;a<t;a++){let l=s[a],g,f,d=-1,u=0;for(;u<l.length&&(o.lastIndex=u,f=o.exec(l),f!==null);)u=o.lastIndex,o===K?f[1]==="!--"?o=Nt:f[1]!==void 0?o=Ot:f[2]!==void 0?(Ft.test(f[2])&&(r=RegExp("</"+f[2],"g")),o=R):f[3]!==void 0&&(o=R):o===R?f[0]===">"?(o=r??K,d=-1):f[1]===void 0?d=-2:(d=o.lastIndex-f[2].length,g=f[1],o=f[3]===void 0?R:f[3]==='"'?zt:Vt):o===zt||o===Vt?o=R:o===Nt||o===Ot?o=K:(o=R,r=void 0);let p=o===R&&s[a+1].startsWith("/>")?" ":"";n+=o===K?l+Ve:d>=0?(i.push(g),l.slice(0,d)+yt+l.slice(d)+M+p):l+M+(d===-2?a:p)}return[Kt(s,n+(s[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]},Y=class s{constructor({strings:e,_$litType$:t},i){let r;this.parts=[];let n=0,o=0,a=e.length-1,l=this.parts,[g,f]=Wt(e,t);if(this.el=s.createElement(g,i),P.currentNode=this.el.content,t===2||t===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(r=P.nextNode())!==null&&l.length<a;){if(r.nodeType===1){if(r.hasAttributes())for(let d of r.getAttributeNames())if(d.endsWith(yt)){let u=f[o++],p=r.getAttribute(d).split(M),_=/([.?@])?(.*)/.exec(u);l.push({type:1,index:n,name:_[2],strings:p,ctor:_[1]==="."?rt:_[1]==="?"?nt:_[1]==="@"?ot:D}),r.removeAttribute(d)}else d.startsWith(M)&&(l.push({type:6,index:n}),r.removeAttribute(d));if(Ft.test(r.tagName)){let d=r.textContent.split(M),u=d.length-1;if(u>0){r.textContent=it?it.emptyScript:"";for(let p=0;p<u;p++)r.append(d[p],W()),P.nextNode(),l.push({type:2,index:++n});r.append(d[u],W())}}}else if(r.nodeType===8)if(r.data===xt)l.push({type:2,index:n});else{let d=-1;for(;(d=r.data.indexOf(M,d+1))!==-1;)l.push({type:7,index:n}),d+=M.length-1}n++}}static createElement(e,t){let i=H.createElement("template");return i.innerHTML=e,i}};function U(s,e,t=s,i){if(e===v)return e;let r=i!==void 0?t._$Co?.[i]:t._$Cl,n=G(e)?void 0:e._$litDirective$;return r?.constructor!==n&&(r?._$AO?.(!1),n===void 0?r=void 0:(r=new n(s),r._$AT(s,t,i)),i!==void 0?(t._$Co??=[])[i]=r:t._$Cl=r),r!==void 0&&(e=U(s,r._$AS(s,e.values),r,i)),e}var st=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:i}=this._$AD,r=(e?.creationScope??H).importNode(t,!0);P.currentNode=r;let n=P.nextNode(),o=0,a=0,l=i[0];for(;l!==void 0;){if(o===l.index){let g;l.type===2?g=new V(n,n.nextSibling,this,e):l.type===1?g=new l.ctor(n,l.name,l.strings,this,e):l.type===6&&(g=new at(n,this,e)),this._$AV.push(g),l=i[++a]}o!==l?.index&&(n=P.nextNode(),o++)}return P.currentNode=H,r}p(e){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}},V=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,r){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=U(this,e,t),G(e)?e===h||e==null||e===""?(this._$AH!==h&&this._$AR(),this._$AH=h):e!==this._$AH&&e!==v&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):jt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==h&&G(this._$AH)?this._$AA.nextSibling.data=e:this.T(H.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:i}=e,r=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=Y.createElement(Kt(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===r)this._$AH.p(t);else{let n=new st(r,this),o=n.u(this.options);n.p(t),this.T(o),this._$AH=n}}_$AC(e){let t=Bt.get(e.strings);return t===void 0&&Bt.set(e.strings,t=new Y(e)),t}k(e){$t(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,r=0;for(let n of e)r===t.length?t.push(i=new s(this.O(W()),this.O(W()),this,this.options)):i=t[r],i._$AI(n),r++;r<t.length&&(this._$AR(i&&i._$AB.nextSibling,r),t.length=r)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let i=Dt(e).nextSibling;Dt(e).remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},D=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,r,n){this.type=1,this._$AH=h,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=h}_$AI(e,t=this,i,r){let n=this.strings,o=!1;if(n===void 0)e=U(this,e,t,0),o=!G(e)||e!==this._$AH&&e!==v,o&&(this._$AH=e);else{let a=e,l,g;for(e=n[0],l=0;l<n.length-1;l++)g=U(this,a[i+l],t,l),g===v&&(g=this._$AH[l]),o||=!G(g)||g!==this._$AH[l],g===h?e=h:e!==h&&(e+=(g??"")+n[l+1]),this._$AH[l]=g}o&&!r&&this.j(e)}j(e){e===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},rt=class extends D{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===h?void 0:e}},nt=class extends D{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==h)}},ot=class extends D{constructor(e,t,i,r,n){super(e,t,i,r,n),this.type=5}_$AI(e,t=this){if((e=U(this,e,t,0)??h)===v)return;let i=this._$AH,r=e===h&&i!==h||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==h&&(i===h||r);r&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},at=class{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){U(this,e)}},Gt={M:yt,P:M,A:xt,C:1,L:Wt,R:st,D:jt,V:U,I:V,H:D,N:nt,U:ot,B:rt,F:at},ze=bt.litHtmlPolyfillSupport;ze?.(Y,V),(bt.litHtmlVersions??=[]).push("3.3.3");var Yt=(s,e,t)=>{let i=t?.renderBefore??e,r=i._$litPart$;if(r===void 0){let n=t?.renderBefore??null;i._$litPart$=r=new V(e.insertBefore(W(),n),n,void 0,t??{})}return r._$AI(s),r};var wt=globalThis,k=class extends T{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Yt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return v}};k._$litElement$=!0,k.finalized=!0,wt.litElementHydrateSupport?.({LitElement:k});var Be=wt.litElementPolyfillSupport;Be?.({LitElement:k});(wt.litElementVersions??=[]).push("4.2.2");var je={attribute:!0,type:String,converter:q,reflect:!1,hasChanged:et},Fe=(s=je,e,t)=>{let{kind:i,metadata:r}=t,n=globalThis.litPropertyMetadata.get(r);if(n===void 0&&globalThis.litPropertyMetadata.set(r,n=new Map),i==="setter"&&((s=Object.create(s)).wrapped=!0),n.set(t.name,s),i==="accessor"){let{name:o}=t;return{set(a){let l=e.get.call(this);e.set.call(this,a),this.requestUpdate(o,l,s,!0,a)},init(a){return a!==void 0&&this.C(o,void 0,s,a),a}}}if(i==="setter"){let{name:o}=t;return function(a){let l=this[o];e.call(this,a),this.requestUpdate(o,l,s,!0,a)}}throw Error("Unsupported decorator location: "+i)};function lt(s){return(e,t)=>typeof t=="object"?Fe(s,e,t):((i,r,n)=>{let o=r.hasOwnProperty(n);return r.constructor.createProperty(n,i),o?Object.getOwnPropertyDescriptor(r,n):void 0})(s,e,t)}function A(s){return lt({...s,state:!0,attribute:!1})}var S={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},E=s=>(...e)=>({_$litDirective$:s,values:e}),w=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var ct=E(class extends w{constructor(s){if(super(s),s.type!==S.ATTRIBUTE||s.name!=="class"||s.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(s){return" "+Object.keys(s).filter(e=>s[e]).join(" ")+" "}update(s,[e]){if(this.st===void 0){this.st=new Set,s.strings!==void 0&&(this.nt=new Set(s.strings.join(" ").split(/\s/).filter(i=>i!=="")));for(let i in e)e[i]&&!this.nt?.has(i)&&this.st.add(i);return this.render(e)}let t=s.element.classList;for(let i of this.st)i in e||(t.remove(i),this.st.delete(i));for(let i in e){let r=!!e[i];r===this.st.has(i)||this.nt?.has(i)||(r?(t.add(i),this.st.add(i)):(t.remove(i),this.st.delete(i)))}return v}});var{I:qe}=Gt,Zt=s=>s;var Jt=()=>document.createComment(""),z=(s,e,t)=>{let i=s._$AA.parentNode,r=e===void 0?s._$AB:e._$AA;if(t===void 0){let n=i.insertBefore(Jt(),r),o=i.insertBefore(Jt(),r);t=new qe(n,o,s,s.options)}else{let n=t._$AB.nextSibling,o=t._$AM,a=o!==s;if(a){let l;t._$AQ?.(s),t._$AM=s,t._$AP!==void 0&&(l=s._$AU)!==o._$AU&&t._$AP(l)}if(n!==r||a){let l=t._$AA;for(;l!==n;){let g=Zt(l).nextSibling;Zt(i).insertBefore(l,r),l=g}}}return t},I=(s,e,t=s)=>(s._$AI(e,t),s),Ke={},Qt=(s,e=Ke)=>s._$AH=e,Xt=s=>s._$AH,ht=s=>{s._$AR(),s._$AA.remove()};var te=(s,e,t)=>{let i=new Map;for(let r=e;r<=t;r++)i.set(s[r],r);return i},ee=E(class extends w{constructor(s){if(super(s),s.type!==S.CHILD)throw Error("repeat() can only be used in text expressions")}dt(s,e,t){let i;t===void 0?t=e:e!==void 0&&(i=e);let r=[],n=[],o=0;for(let a of s)r[o]=i?i(a,o):o,n[o]=t(a,o),o++;return{values:n,keys:r}}render(s,e,t){return this.dt(s,e,t).values}update(s,[e,t,i]){let r=Xt(s),{values:n,keys:o}=this.dt(e,t,i);if(!Array.isArray(r))return this.ut=o,n;let a=this.ut??=[],l=[],g,f,d=0,u=r.length-1,p=0,_=n.length-1;for(;d<=u&&p<=_;)if(r[d]===null)d++;else if(r[u]===null)u--;else if(a[d]===o[p])l[p]=I(r[d],n[p]),d++,p++;else if(a[u]===o[_])l[_]=I(r[u],n[_]),u--,_--;else if(a[d]===o[_])l[_]=I(r[d],n[_]),z(s,l[_+1],r[d]),d++,_--;else if(a[u]===o[p])l[p]=I(r[u],n[p]),z(s,r[d],r[u]),u--,p++;else if(g===void 0&&(g=te(o,p,_),f=te(a,d,u)),g.has(a[d]))if(g.has(a[u])){let $=f.get(o[p]),y=$!==void 0?r[$]:null;if(y===null){let St=z(s,r[d]);I(St,n[p]),l[p]=St}else l[p]=I(y,n[p]),z(s,r[d],y),r[$]=null;p++}else ht(r[u]),u--;else ht(r[d]),d++;for(;p<=_;){let $=z(s,l[_+1]);I($,n[p]),l[p++]=$}for(;d<=u;){let $=r[d++];$!==null&&ht($)}return this.ut=o,Qt(s,l),v}});var ie="important",We=" !"+ie,Et=E(class extends w{constructor(s){if(super(s),s.type!==S.ATTRIBUTE||s.name!=="style"||s.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(s){return Object.keys(s).reduce((e,t)=>{let i=s[t];return i==null?e:e+`${t=t.includes("-")?t:t.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${i};`},"")}update(s,[e]){let{style:t}=s.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(e)),this.render(e);for(let i of this.ft)e[i]==null&&(this.ft.delete(i),i.includes("-")?t.removeProperty(i):t[i]=null);for(let i in e){let r=e[i];if(r!=null){this.ft.add(i);let n=typeof r=="string"&&r.endsWith(We);i.includes("-")||n?t.setProperty(i,n?r.slice(0,-11):r,n?ie:""):t[i]=r}}return v}});var se=["#f59e0b","#14b8a6","#6366f1","#ec4899","#0ea5e9","#22c55e"];function Ge(s){let e=0;for(let t=0;t<s.length;t++)e=e*31+s.charCodeAt(t)|0;return se[Math.abs(e)%se.length]}var Ct="#03a9f4",Ye="#ffffff",Ze="#1c1917",Je=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;function pt(s){let e=Je.exec(s.trim());if(!e)return null;let t=e[1];t.length===3&&(t=t.split("").map(r=>r+r).join(""));let i=parseInt(t,16);return[i>>16&255,i>>8&255,i&255]}function re(s){let e=pt(s);if(e)return e;let t=/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(s.trim());return t?[Number(t[1]),Number(t[2]),Number(t[3])].map(i=>Math.max(0,Math.min(255,Math.round(i)))):null}function ut([s,e,t]){return"#"+[s,e,t].map(i=>i.toString(16).padStart(2,"0")).join("")}function ne([s,e,t]){let i=r=>{let n=r/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4};return .2126*i(s)+.7152*i(e)+.0722*i(t)}function oe(s,e){let t=ne(s),i=ne(e);return(Math.max(t,i)+.05)/(Math.min(t,i)+.05)}function ae(s,e,t){return s.map((i,r)=>Math.round(i+(e[r]-i)*t))}var Qe=(s,e)=>ae(s,[255,255,255],e),Xe=(s,e)=>ae(s,[0,0,0],e);function le(s,e){return typeof s=="string"&&pt(s)?ut(pt(s)):Ge(e??"")}var ti={dark:{field:"rgba(0, 0, 0, 0.3)",hover:"rgba(255, 255, 255, 0.05)",track:"rgba(255, 255, 255, 0.14)"},light:{field:"rgba(0, 0, 0, 0.06)",hover:"rgba(0, 0, 0, 0.04)",track:"rgba(0, 0, 0, 0.1)"}},ei=3,ii=4.5,si=.38;function ri(s){return oe([255,255,255],s)>=ei?Ye:Ze}function ni(s,e,t){if(t)return ut(Qe(s,si));let i=s;for(let r=0;r<8&&oe(i,e)<ii;r++)i=Xe(i,.12);return ut(i)}function oi(s,e){let[t,i,r]=s;return`rgba(${t}, ${i}, ${r}, ${e?.18:.1})`}function de(s,e,t){let i=re(s)??pt(Ct),r=re(e)??(t?[28,28,28]:[255,255,255]);return{accent:ut(i),glyph:ri(i),ink:ni(i,r,t),tint:oi(i,t),...ti[t?"dark":"light"]}}var B="listapp-list-card",Z=(s,e)=>typeof s=="boolean"?s:e;function ce(s){if(!s||typeof s!="object")throw new Error("Invalid configuration");if(typeof s.entity!="string"||!/^todo\.[a-z0-9_]+$/.test(s.entity))throw new Error("Specify an entity from within the todo domain");if(s.item_tap_action!==void 0&&s.item_tap_action!=="toggle"&&s.item_tap_action!=="edit")throw new Error("item_tap_action must be 'toggle' or 'edit'");let e=s.collapse_to??0;if(typeof e!="number"||!Number.isInteger(e)||e<0)throw new Error("collapse_to must be a non-negative integer");return{entity:s.entity,title:typeof s.title=="string"&&s.title.trim()?s.title:void 0,useListColor:Z(s.use_list_color,!0),showTitle:Z(s.show_title,!0),showAdd:Z(s.show_add,!0),showCompleted:Z(s.show_completed,!0),showProgress:Z(s.show_progress,!0),collapseTo:e,itemTapAction:s.item_tap_action??"toggle"}}function he(s){let e=s.find(t=>t.startsWith("todo.listapp_"))??s.find(t=>t.startsWith("todo."))??"";return{type:`custom:${B}`,entity:e}}var L={CREATE:1,DELETE:2,UPDATE:4,MOVE:8},pe="unavailable",ue="unknown",N=(s,e)=>((s?.attributes.supported_features??0)&e)!==0,me=(s,e,t)=>s.connection.subscribeMessage(t,{type:"todo/item/subscribe",entity_id:e}),ge=(s,e,t)=>s.callService("todo","add_item",{item:t},{entity_id:e}),fe=(s,e,t,i)=>s.callService("todo","update_item",{item:t.uid,status:i},{entity_id:e}),_e=(s,e,t,i)=>s.callService("todo","update_item",{item:t.uid,rename:i},{entity_id:e}),Tt=(s,e,t)=>s.callService("todo","remove_item",{item:t},{entity_id:e}),ve=(s,e,t,i)=>s.callWS({type:"todo/item/move",entity_id:e,uid:t,previous_uid:i}),be=(s,e)=>s.callWS({type:"config/entity_registry/get",entity_id:e}),ye=(s,e)=>s.callWS({type:"config_entries/get",domain:e}),xe=s=>s.callWS({type:"config_entries/flow/progress"}),$e="/config/integrations/integration/listapp";function Ae(s){history.pushState(null,"",s),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0,detail:{replace:!1}}))}var O=class extends w{constructor(e){if(super(e),this.it=h,e.type!==S.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===h||e==null)return this._t=void 0,this.it=e;if(e===v)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};O.directiveName="unsafeHTML",O.resultType=1;var Us=E(O);var J=class extends O{};J.directiveName="unsafeSVG",J.resultType=2;var we=E(J);var mt={"list-checks":'<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>',star:'<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',sparkles:'<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',gift:'<path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/>',home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',"shopping-cart":'<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"/><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',"shopping-bag":'<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',utensils:'<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>',coffee:'<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',cake:'<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',plane:'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',car:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',"map-pin":'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',luggage:'<path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/><path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14"/><path d="M10 20h4"/><circle cx="16" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',backpack:'<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',briefcase:'<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',"dollar-sign":'<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',"book-open":'<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',"graduation-cap":'<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',dumbbell:'<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',"party-popper":'<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',"paw-print":'<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',baby:'<path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M15 12h.01"/><path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/><path d="M9 12h.01"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>'},Ee={plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',check:'<path d="M20 6 9 17l-5-5"/>',"square-check":'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m16 9-5.5 5.5L8 12"/>',"circle-check":'<circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/>',"triangle-alert":'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',"cloud-off":'<path d="M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057"/><path d="M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78"/><path d="m2 2 20 20"/>',"grip-vertical":'<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',"chevron-down":'<path d="m6 9 6 6 6-6"/>',"chevron-up":'<path d="m18 15-6-6-6 6"/>',"arrow-up":'<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',"arrow-down":'<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',trash:'<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',"list-checks":'<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>'};var ai="list-checks",Ks=Object.keys(mt);function li(s){return s&&Object.hasOwn(mt,s)?s:ai}var Ce=(s,e)=>qt`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width=${e} height=${e} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${we(s)}</svg>`,Te=(s,e=20)=>Ce(mt[li(s)],e),C=(s,e=20)=>Ce(Ee[s],e);function ci(s){let e=[],t=[];for(let i of s)(i.status==="completed"?t:e).push(i);return{active:e,completed:t}}function hi(s){return s?s.attributes.role==="viewer"?!0:!N(s,L.CREATE)||!N(s,L.UPDATE):!1}function pi(s,e,t){return t||e<=0||s.length<=e?{shown:s,hidden:0}:{shown:s.slice(0,e),hidden:s.length-e}}function ui(s,e,t){return t?`${s} ${s===1?"item":"items"} \xB7 view only`:s===0?"No items":`${e} of ${s} done`}function mi(s,e){let t=s?.attributes.friendly_name;return typeof t=="string"&&t.trim()?t:e.split(".")[1]?.replace(/^listapp_/,"").replace(/_/g," ")??e}var Mt=s=>s.state===pe||s.state===ue;function kt(s,e,t,i=void 0,r="listapp"){return!s||!Mt(s)?"available":t?.some(a=>a.handler===r&&a.context?.source==="reauth"&&(!i||a.context.entry_id===i))||e?.some(a=>a.domain===r&&(!i||a.entry_id===i)&&a.state==="setup_error"&&/auth|token|sign in|log in|credential/i.test(a.reason??""))?"auth":"transient"}function Me({config:s,stateObj:e,items:t,availability:i,expanded:r}){let n=hi(e),o=!n&&N(e,L.CREATE),a=!n&&N(e,L.UPDATE),l=!n&&N(e,L.DELETE),g=!n&&N(e,L.MOVE),{active:f,completed:d}=ci(t??[]),u=f.length+d.length,p=d.length,{shown:_,hidden:$}=pi(f,s.collapseTo,r),y;return e?i==="auth"?y="unavailable_auth":i==="transient"?y="unavailable_transient":t===void 0?y="loading":u===0?y="empty":f.length===0?y="all_done":y="list":y="missing",{state:y,viewer:n,canCreate:o,canUpdate:a,canDelete:l,canMove:g,title:s.title??mi(e,s.entity),subline:ui(u,p,n),total:u,done:p,progress:u===0?0:p/u,active:f,completed:d,visibleActive:_,hiddenActive:$,showAdd:s.showAdd&&o,showCompleted:s.showCompleted,showProgress:s.showProgress}}function ke(s,e,t){let i=s.filter(o=>o.uid!==e),r=s.find(o=>o.uid===e);if(!r)return{order:s,previousUid:void 0};let n=Math.max(0,Math.min(t,i.length));return i.splice(n,0,r),{order:i,previousUid:n===0?void 0:i[n-1].uid}}var c={addPlaceholder:"Add item",addButton:"Add item",active:"Active",completed:"Completed",reorder:"Reorder items",exitReorder:"Done reordering",clearCompleted:"Clear completed",clearConfirmTitle:"Clear completed items?",clearConfirmText:s=>`This will permanently delete ${s} completed ${s===1?"item":"items"} from the list.`,cancel:"Cancel",delete:"Delete",save:"Save",editTitle:"Edit item",editLabel:"Item",emptyTitle:"Nothing on this list",emptyBody:"Add the first item above, or ask Assist to add one.",emptyBodyNoAdd:"Ask Assist or the Listapp app to add the first item.",emptyBodyViewer:"Nothing has been added yet.",allDoneTitle:"All done",allDoneBody:"Every item on this list is checked off.",allDoneHidden:s=>`${s} completed ${s===1?"item is":"items are"} hidden.`,authTitle:"List unavailable",authBody:"Listapp needs you to sign in again before this list can sync.",signIn:"Sign in",transientTitle:"Can't reach Listapp right now",transientBody:"Home Assistant will keep retrying. Check the integration if this persists.",saveFailed:"Listapp couldn't save that change. Try again.",checkIntegration:"Check integration",missing:s=>`Entity not found: ${s}`,showMore:s=>`Show ${s} more`,showLess:"Show less",markDone:s=>`Mark "${s}" done`,markActive:s=>`Mark "${s}" not done`,dragHandle:s=>`Move "${s}" \u2014 drag, or use arrow keys`,menu:s=>`${s} options`};var gi=560,fi=3e4,b=class extends k{constructor(){super(...arguments);this._availability="available";this._expanded=!1;this._reordering=!1;this._menu=null;this._wide=!1;this._dialog=null;this._dragUid=null;this._dropIndex=null;this._submitAdd=async t=>{t.preventDefault();let r=t.currentTarget.elements.namedItem("summary"),n=r.value.trim();if(!n||!this.hass||!this._config)return;let{hass:o,_config:a}=this;await this._call(()=>ge(o,a.entity,n))&&(r.value=""),r.focus()};this._checkboxChanged=t=>{let i=t.currentTarget;this._toggleItem(this._item(i.dataset.uid))};this._itemTapped=t=>{let i=t.currentTarget.dataset.uid,r=this._item(i);r&&(this._config.itemTapAction==="edit"?this._dialog={kind:"edit",item:r}:this._toggleItem(r))};this._toggleExpanded=()=>{this._expanded=!this._expanded};this._toggleMenu=t=>{t.stopPropagation();let i=t.currentTarget.dataset.menu;this._menu=this._menu===i?null:i};this._onDocumentClick=()=>{this._menu&&(this._menu=null)};this._menuKeydown=t=>{if(t.key==="Escape"&&this._menu){let i=this._menu;this._menu=null,this.renderRoot.querySelector(`.menu-btn[data-menu="${i}"]`)?.focus()}};this._toggleReorder=()=>{this._reordering=!this._reordering,this._menu=null,this._reordering&&(this._expanded=!0);let t=this._reordering?".handle":'.menu-btn[data-menu="active"]';this.updateComplete.then(()=>this.renderRoot.querySelector(t)?.focus())};this._clearCompleted=async()=>{let t=this._dialog;if(this._closeDialog(),t?.kind==="confirm-clear"&&this.hass&&this._config&&t.uids.length){let{hass:i,_config:r}=this;await this._call(()=>Tt(i,r.entity,t.uids))}};this._closeDialog=()=>{let t=this.renderRoot?.querySelector("dialog");t?.open&&t.close(),this._dialog=null};this._saveEdit=async t=>{t.preventDefault();let i=this._dialog,n=t.currentTarget.elements.namedItem("summary").value.trim();if(i?.kind==="edit"&&n&&n!==i.item.summary&&this.hass&&this._config){let{hass:o,_config:a}=this;if(!await this._call(()=>_e(o,a.entity,i.item,n)))return}this._closeDialog()};this._deleteFromDialog=async()=>{let t=this._dialog;if(t?.kind==="edit"&&this.hass&&this._config){let{hass:i,_config:r}=this;if(!await this._call(()=>Tt(i,r.entity,[t.item.uid])))return}this._closeDialog()};this._signIn=()=>{Ae($e)};this._dragStart=t=>{let i=t.currentTarget;this._dragUid=i.dataset.uid??null,t.dataTransfer?.setData("text/plain",this._dragUid??""),t.dataTransfer&&(t.dataTransfer.effectAllowed="move")};this._dragOver=t=>{if(!this._dragUid)return;t.preventDefault();let i=t.target.closest("li.item");if(!i)return;let r=i.getBoundingClientRect(),n=Number(i.dataset.index);this._dropIndex=t.clientY>r.top+r.height/2?n+1:n};this._drop=t=>{t.preventDefault();let i=this._dragUid,r=this._dropIndex;if(this._dragUid=null,this._dropIndex=null,!i||r===null)return;let o=this._view().active.findIndex(l=>l.uid===i),a=r>o?r-1:r;this._move(i,a)};this._dragEnd=()=>{this._dragUid=null,this._dropIndex=null};this._handleKeydown=t=>{if(t.key!=="ArrowUp"&&t.key!=="ArrowDown")return;t.preventDefault();let i=t.currentTarget,r=i.dataset.uid,n=Number(i.dataset.index),o=t.key==="ArrowUp"?n-1:n+1,a=this._view().active;o<0||o>=a.length||this._move(r,o).then(async()=>{await this.updateComplete,this.renderRoot.querySelector(`.handle[data-uid="${r}"]`)?.focus()})}}static getStubConfig(t,i,r){return he([...i,...r])}setConfig(t){this._config=ce(t),this._expanded=!1,this._reordering=!1,this._menu=null,this._closeDialog()}async _call(t){try{return await t(),!0}catch(i){return console.warn("listapp-list-card: service call failed",i),this.dispatchEvent(new CustomEvent("hass-notification",{bubbles:!0,composed:!0,detail:{message:c.saveFailed}})),this.requestUpdate(),!1}}getCardSize(){if(!this._config)return 3;let t=this._view();if(t.state==="missing"||t.state==="unavailable_auth"||t.state==="unavailable_transient")return 3;let i=this._wide?2:1,r=t.showCompleted&&!this._reordering?t.completed.length:0,n=Math.ceil(t.visibleActive.length/i)+Math.ceil(r/i);return 2+(t.showAdd?1:0)+n+1}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}connectedCallback(){super.connectedCallback(),this.hasUpdated&&this._subscribe(),this._resize??=new ResizeObserver(t=>{let i=t[0]?.contentRect.width??0;this._wide=i>=gi}),this._resize.observe(this),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribe(),this._resize?.disconnect(),document.removeEventListener("click",this._onDocumentClick),this._stopAvailabilityTimer()}willUpdate(t){!this.hass||!this._config||((this._subscribedEntity!==this._config.entity||!this._unsub&&this._config.entity in this.hass.states)&&(this._items=void 0,this._subscribe()),(t.has("hass")||t.has("_config"))&&this._trackAvailability(),this._reordering&&this._view().active.length===0&&(this._reordering=!1))}_stateObj(){return this.hass&&this._config?this.hass.states[this._config.entity]:void 0}_view(){return Me({config:this._config,stateObj:this._stateObj(),items:this._items,availability:this._availability,expanded:this._expanded})}_subscribe(){if(this._unsubscribe(),!this.hass||!this._config||!(this._config.entity in this.hass.states))return;let t=this._config.entity;this._subscribedEntity=t;let i=me(this.hass,t,r=>{this._subscribedEntity===t&&(this._items=r.items)}).catch(r=>(console.warn("listapp-list-card: item subscription failed",r),this._unsub===i&&(this._unsub=void 0,this._subscribedEntity=void 0),()=>{}));this._unsub=i}_unsubscribe(){this._unsub?.then(t=>t()),this._unsub=void 0,this._subscribedEntity=void 0}_trackAvailability(){let t=this._stateObj();if(!t||!Mt(t)){this._availability="available",this._checkedAvailabilityFor=void 0,this._stopAvailabilityTimer();return}let i=`${t.entity_id}:${t.state}`;this._checkedAvailabilityFor!==i&&(this._checkedAvailabilityFor=i,this._availability="transient",this._checkAvailability(),this._stopAvailabilityTimer(),this._availabilityTimer=window.setInterval(()=>{this._checkAvailability()},fi))}_stopAvailabilityTimer(){this._availabilityTimer!==void 0&&(window.clearInterval(this._availabilityTimer),this._availabilityTimer=void 0)}async _checkAvailability(){let t=this._config?.entity,i=this._checkedAvailabilityFor;if(!this.hass||!t||!i)return;let r;try{let[n,o,a]=await Promise.all([ye(this.hass,"listapp"),xe(this.hass),this._resolveEntryId()]);r=kt(this._stateObj(),n,o,a)}catch{r=kt(this._stateObj(),void 0,void 0)}this._config?.entity===t&&this._checkedAvailabilityFor===i&&(this._availability=r)}async _resolveEntryId(){let t=this._config?.entity;if(!(!this.hass||!t)){if(this._entryIdFor!==t){try{this._entryId=(await be(this.hass,t)).config_entry_id??null}catch{this._entryId=void 0}this._entryIdFor=t}return this._entryId}}_resolvePalette(){let t=this._stateObj(),i=this.hass?.themes?.darkMode??window.matchMedia?.("(prefers-color-scheme: dark)").matches??!1,r=getComputedStyle(this),n=r.getPropertyValue("--card-background-color").trim()||(i?"#1c1c1c":"#ffffff"),o=this._config.useListColor?le(t?.attributes.color,t?.attributes.list_id??this._config.entity):r.getPropertyValue("--primary-color").trim()||Ct,a=`${o}|${n}|${i}`;return this._paletteKey!==a&&(this._paletteKey=a,this._palette=de(o,n,i)),this._palette}render(){if(!this.hass||!this._config)return h;let t=this._view(),i=this._resolvePalette(),r={"--la-accent":i.accent,"--la-glyph":i.glyph,"--la-ink":i.ink,"--la-tint":i.tint,"--la-field":i.field,"--la-hover":i.hover,"--la-track":i.track};return m`
      <ha-card
        style=${Et(r)}
        class=${ct({wide:this._wide,viewer:t.viewer,reordering:this._reordering})}
      >
        ${t.state==="missing"?this._renderMissing():this._renderCard(t)}
        ${this._renderDialog(t)}
      </ha-card>
    `}_renderMissing(){return m`<div class="notice">${C("triangle-alert",22)}<span>${c.missing(this._config.entity)}</span></div>`}_renderCard(t){let i=this._stateObj();return t.state==="unavailable_auth"||t.state==="unavailable_transient"?this._renderUnavailable(t):m`
      ${this._renderHeader(t,i.attributes.icon)}
      ${t.showProgress?this._renderProgress(t):h}
      ${this._renderBody(t)}
    `}_renderHeader(t,i){return m`
      <header class="head">
        <div class="tile" aria-hidden="true">${Te(i,20)}</div>
        <div class="titles">
          ${this._config.showTitle?m`<h2 class="title">${t.title}</h2>`:h}
          <p class="subline">${t.subline}</p>
        </div>
      </header>
    `}_renderProgress(t){let i=Math.round(t.progress*100);return m`
      <div
        class="progress"
        role="progressbar"
        aria-label=${c.completed}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${i}
      >
        <div class="progress-fill" style=${Et({width:`${i}%`})}></div>
      </div>
    `}_renderUnavailable(t){let i=t.state==="unavailable_auth";return m`
      <div class="state unavailable">
        <div class="warn">${C(i?"triangle-alert":"cloud-off",28)}</div>
        <h3>${i?c.authTitle:c.transientTitle}</h3>
        <p>${i?c.authBody:c.transientBody}</p>
        ${i?m`<button class="primary" @click=${this._signIn}>${c.signIn}</button>`:m`<button class="text" @click=${this._signIn}>${c.checkIntegration}</button>`}
      </div>
    `}_renderBody(t){return m`
      ${t.state==="loading"?h:m`${t.showAdd?this._renderAdd():h}${this._renderSections(t)}`}
    `}_renderAdd(){return m`
      <form class="add" @submit=${this._submitAdd}>
        <input
          class="add-input"
          name="summary"
          type="text"
          autocomplete="off"
          placeholder=${c.addPlaceholder}
          aria-label=${c.addPlaceholder}
        />
        <button type="submit" class="add-btn" title=${c.addButton} aria-label=${c.addButton}>
          ${C("plus",20)}
        </button>
      </form>
    `}_renderSections(t){if(t.state==="empty")return m`
        <div class="state empty">
          <div class="state-icon">${C("square-check",23)}</div>
          <h3>${c.emptyTitle}</h3>
          <p>${t.viewer?c.emptyBodyViewer:t.showAdd?c.emptyBody:c.emptyBodyNoAdd}</p>
        </div>
      `;let i=this._reordering?c.reorder:c.active;return m`
      ${t.state==="all_done"?m`
            <div class="state all-done">
              <div class="state-icon done">${C("check",24)}</div>
              <h3>${c.allDoneTitle}</h3>
              <p>${t.showCompleted?c.allDoneBody:c.allDoneHidden(t.done)}</p>
            </div>
          `:m`
            <section class="section" aria-label=${c.active}>
              <div class="section-head">
                <h3>${i}<span class="count"> · ${t.active.length}</span></h3>
                ${t.canMove?this._renderMenu("active",t):h}
              </div>
              ${this._renderItems(t.visibleActive,t,!0)}
              ${t.hiddenActive>0||this._expanded&&this._config.collapseTo>0&&t.active.length>this._config.collapseTo?m`
                    <button class="more" @click=${this._toggleExpanded} aria-expanded=${this._expanded}>
                      ${this._expanded?c.showLess:c.showMore(t.hiddenActive)}
                      ${C(this._expanded?"chevron-up":"chevron-down",15)}
                    </button>
                  `:h}
            </section>
          `}
      ${t.showCompleted&&t.completed.length&&!this._reordering?m`
            <div class="divider" role="separator"></div>
            <section class="section completed" aria-label=${c.completed}>
              <div class="section-head">
                <h3>${c.completed}<span class="count"> · ${t.completed.length}</span></h3>
                ${t.canDelete?this._renderMenu("completed",t):h}
              </div>
              ${this._renderItems(t.completed,t,!1)}
            </section>
          `:h}
    `}_renderMenu(t,i){let r=this._menu===t,n=t==="active"?c.active:c.completed;return m`
      <div class="menu-wrap" @keydown=${this._menuKeydown}>
        <button
          class="menu-btn"
          aria-haspopup="menu"
          aria-expanded=${r}
          aria-label=${c.menu(n)}
          title=${c.menu(n)}
          data-menu=${t}
          @click=${this._toggleMenu}
        >
          <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
        ${r?m`
              <div class="menu" role="menu">
                ${t==="active"?m`<button role="menuitem" @click=${this._toggleReorder}>
                      ${this._reordering?c.exitReorder:c.reorder}
                    </button>`:m`<button role="menuitem" class="danger" @click=${()=>this._confirmClear(i)}>
                      ${C("trash",18)} ${c.clearCompleted}
                    </button>`}
              </div>
            `:h}
      </div>
    `}_renderItems(t,i,r){let n=this._reordering&&r&&i.canMove;return m`
      <ul
        class=${ct({items:!0,reorder:n})}
        @dragover=${n?this._dragOver:h}
        @drop=${n?this._drop:h}
      >
        ${ee(t,o=>o.uid,(o,a)=>this._renderItem(o,a,i,n))}
      </ul>
    `}_renderItem(t,i,r,n){let o=t.status==="completed",a=r.canUpdate,l=o?c.markActive(t.summary):c.markDone(t.summary);return m`
      <li
        class=${ct({item:!0,done:o,interactive:a,dragging:this._dragUid===t.uid,"drop-before":this._dropIndex===i&&this._dragUid!==t.uid})}
        data-uid=${t.uid}
        data-index=${i}
        draggable=${n?"true":"false"}
        @dragstart=${n?this._dragStart:h}
        @dragend=${n?this._dragEnd:h}
      >
        <label class="check">
          <input
            type="checkbox"
            .checked=${o}
            .disabled=${!a}
            aria-label=${l}
            data-uid=${t.uid}
            @change=${this._checkboxChanged}
          />
          <span class="box" aria-hidden="true">${C("check",14)}</span>
        </label>
        ${a?m`<button class="summary" data-uid=${t.uid} @click=${this._itemTapped}>${t.summary}</button>`:m`<span class="summary">${t.summary}</span>`}
        ${n?m`
              <button
                class="icon-btn handle"
                aria-label=${c.dragHandle(t.summary)}
                title=${c.dragHandle(t.summary)}
                data-uid=${t.uid}
                data-index=${i}
                @keydown=${this._handleKeydown}
              >
                ${C("grip-vertical",18)}
              </button>
            `:h}
      </li>
    `}_renderDialog(t){let i=this._dialog;return i?i.kind==="edit"?m`
        <dialog class="dialog" @close=${this._closeDialog} @cancel=${this._closeDialog}>
          <form method="dialog" @submit=${this._saveEdit}>
            <h3>${c.editTitle}</h3>
            <label class="field">
              <span>${c.editLabel}</span>
              <input name="summary" type="text" required autofocus .value=${i.item.summary} />
            </label>
            <div class="actions">
              ${t.canDelete?m`<button type="button" class="danger text" @click=${this._deleteFromDialog}>${c.delete}</button>`:h}
              <span class="spacer"></span>
              <button type="button" class="text" @click=${this._closeDialog}>${c.cancel}</button>
              <button type="submit" class="primary">${c.save}</button>
            </div>
          </form>
        </dialog>
      `:m`
      <dialog class="dialog" @close=${this._closeDialog} @cancel=${this._closeDialog}>
        <h3>${c.clearConfirmTitle}</h3>
        <p>${c.clearConfirmText(i.uids.length)}</p>
        <div class="actions">
          <span class="spacer"></span>
          <button type="button" class="text" @click=${this._closeDialog}>${c.cancel}</button>
          <button type="button" class="primary danger-bg" @click=${this._clearCompleted}>${c.delete}</button>
        </div>
      </dialog>
    `:h}updated(t){if(t.has("_dialog")&&this._dialog){let i=this.renderRoot.querySelector("dialog");i&&!i.open&&(i.showModal(),i.querySelector("input")?.select())}}_item(t){return t?this._items?.find(i=>i.uid===t):void 0}async _toggleItem(t){if(!t||!this.hass||!this._config)return;let i=t.status==="completed"?"needs_action":"completed",{hass:r,_config:n}=this;await this._call(()=>fe(r,n.entity,t,i))}_confirmClear(t){this._menu=null,this._dialog={kind:"confirm-clear",uids:t.completed.map(i=>i.uid)}}async _move(t,i){if(!this.hass||!this._config||!this._items)return;let r=this._items,{active:n,completed:o}=this._view(),{order:a,previousUid:l}=ke(n,t,i),g=[...a,...o];this._items=g;let{hass:f,_config:d}=this;await this._call(()=>ve(f,d.entity,t,l))||this._items===g&&this._config===d&&(this._items=r)}static{this.styles=ft`
    :host {
      display: block;
    }
    ha-card {
      display: block;
      position: relative;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
      color: var(--primary-text-color);
      font-family: var(--ha-card-font-family, var(--paper-font-body1_-_font-family, inherit));
      --la-target: 44px;
      --la-muted: var(--secondary-text-color);
    }
    button {
      font: inherit;
      color: inherit;
      background: none;
      border: 0;
      padding: 0;
      margin: 0;
      cursor: pointer;
    }
    button:focus-visible,
    input:focus-visible {
      outline: 2px solid var(--la-ink);
      outline-offset: 2px;
    }
    svg {
      display: block;
    }
    .viewer button.summary,
    .viewer .check {
      cursor: default;
    }

    .head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 18px 0;
    }
    .tile {
      flex: none;
      width: 38px;
      height: 38px;
      border-radius: 11px;
      display: grid;
      place-items: center;
      background: var(--la-accent);
      color: var(--la-glyph);
    }
    .titles {
      min-width: 0;
    }
    .title {
      margin: 0;
      font-size: 17.5px;
      font-weight: 800;
      letter-spacing: -0.2px;
      line-height: 1.25;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .subline {
      margin: 1px 0 0;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--la-muted);
    }

    .progress {
      height: 5px;
      margin: 14px 18px 0;
      border-radius: 99px;
      background: var(--la-track);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 99px;
      background: var(--la-accent);
      transition: width 200ms ease;
    }

    .add {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin: 16px 18px 0;
      padding: 13px 14px;
      border-radius: 10px 10px 0 0;
      background: var(--la-field);
      border-bottom: 2px solid var(--la-accent);
    }
    .add-input {
      flex: 1;
      min-width: 0;
      padding: 0;
      font: inherit;
      font-size: 15.5px;
      font-weight: 500;
      line-height: 20px;
      color: var(--primary-text-color);
      background: transparent;
      border: 0;
      outline: none;
    }
    .add-input::placeholder {
      color: var(--la-muted);
      opacity: 1;
    }
    .add-btn {
      flex: none;
      position: relative;
      width: 20px;
      height: 20px;
      color: var(--la-ink);
    }
    .add-btn svg {
      stroke-width: 2.4;
    }
    .add-btn::before,
    .menu-btn::before {
      content: "";
      position: absolute;
      inset: -12px;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 16px 6px;
    }
    .completed .section-head {
      padding: 14px 16px 4px;
    }
    .section-head h3 {
      margin: 0;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--la-muted);
    }
    .divider {
      height: 1px;
      margin: 12px 0 0;
      background: var(--divider-color);
    }
    .menu-btn {
      position: relative;
      padding: 5px;
      border-radius: 6px;
      color: var(--la-muted);
    }
    .menu-btn:hover,
    .menu-btn[aria-expanded="true"] {
      background: var(--la-hover);
    }
    .dots {
      display: flex;
      gap: 3px;
    }
    .dots i {
      width: 3.5px;
      height: 3.5px;
      border-radius: 50%;
      background: currentColor;
    }

    .items {
      list-style: none;
      margin: 0;
      padding: 0 10px 4px;
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 2px;
    }
    .completed .items {
      padding-bottom: 12px;
    }
    .section:last-child .items {
      padding-bottom: 12px;
    }
    .wide .items {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 13px;
      min-height: var(--la-target);
      box-sizing: border-box;
      padding: 11px 8px;
      border-radius: 10px;
    }
    .item.interactive:hover {
      background: var(--la-hover);
    }
    .check {
      flex: none;
      position: relative;
      width: 22px;
      height: 22px;
      cursor: pointer;
    }
    .check input {
      position: absolute;
      inset: -11px;
      width: var(--la-target);
      height: var(--la-target);
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }
    .check input:disabled {
      cursor: default;
    }
    .box {
      width: 22px;
      height: 22px;
      box-sizing: border-box;
      border-radius: 7px;
      border: 2px solid var(--la-muted);
      display: grid;
      place-items: center;
      color: transparent;
      transition:
        background 120ms ease,
        border-color 120ms ease;
    }
    .box svg {
      stroke-width: 3.2;
    }
    .check input:checked + .box {
      background: var(--la-accent);
      border-color: var(--la-accent);
      color: var(--la-glyph);
    }
    .check input:focus-visible + .box {
      outline: 2px solid var(--la-ink);
      outline-offset: 2px;
    }
    .summary {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      padding: 0;
      text-align: left;
      font-size: 15.5px;
      font-weight: 600;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .done .summary {
      font-weight: 500;
      color: var(--la-muted);
      text-decoration: line-through;
    }
    .handle {
      flex: none;
      width: 22px;
      height: 22px;
      display: grid;
      place-items: center;
      cursor: grab;
      color: var(--la-muted);
    }
    .reorder .item.dragging {
      opacity: 0.4;
    }
    .reorder .item.drop-before {
      box-shadow: inset 0 2px 0 var(--la-accent);
    }

    .more {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin: 6px 18px 0;
      padding: 4px 0;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--la-ink);
    }
    .more svg {
      stroke-width: 2.6;
    }
    .section:last-child .more {
      margin-bottom: 14px;
    }

    .menu-wrap {
      position: relative;
    }
    .menu {
      position: absolute;
      top: calc(100% + 2px);
      right: 0;
      z-index: 2;
      min-width: 200px;
      padding: 4px 0;
      border-radius: 12px;
      background: var(--card-background-color, #fff);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
      border: 1px solid var(--divider-color);
    }
    .menu button {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      min-height: var(--la-target);
      padding: 0 16px;
      text-align: left;
      white-space: nowrap;
      font-size: 14px;
      font-weight: 600;
    }
    .menu button:hover {
      background: var(--la-hover);
    }
    .danger {
      color: var(--error-color, #db4437);
    }

    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 9px;
      text-align: center;
      padding: 30px 22px 28px;
    }
    .state.all-done {
      padding: 26px 22px 24px;
    }
    .state.unavailable {
      gap: 10px;
      padding: 30px 22px 26px;
    }
    .state-icon {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      background: var(--la-tint);
      color: var(--la-ink);
    }
    .state-icon.done {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--la-accent);
      color: var(--la-glyph);
    }
    .state-icon.done svg {
      stroke-width: 3;
    }
    .warn {
      color: var(--warning-color, #f59e0b);
    }
    .state h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
    }
    .state p {
      margin: 0;
      max-width: 250px;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--la-muted);
    }
    .state.unavailable p {
      max-width: 270px;
    }
    .state .primary,
    .state .text {
      margin-top: 6px;
    }
    .notice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      color: var(--warning-color, #ff9800);
    }

    .primary {
      padding: 9px 16px;
      border-radius: 10px;
      background: var(--la-accent);
      color: var(--la-glyph);
      font-size: 14px;
      font-weight: 700;
    }
    .primary.danger-bg {
      background: var(--error-color, #db4437);
      color: #fff;
    }
    .text {
      padding: 9px 16px;
      border-radius: 10px;
      color: var(--la-ink);
      font-size: 14px;
      font-weight: 700;
    }
    .text:hover {
      background: var(--la-hover);
    }
    .primary:hover {
      filter: brightness(0.95);
    }

    .dialog {
      min-width: min(320px, calc(100vw - 32px));
      max-width: 480px;
      padding: 20px 24px;
      border: 0;
      border-radius: var(--ha-dialog-border-radius, 28px);
      background: var(--card-background-color, var(--ha-card-background, #fff));
      color: var(--primary-text-color);
      box-shadow: var(--ha-card-box-shadow, 0 8px 32px rgba(0, 0, 0, 0.32));
    }
    .dialog::backdrop {
      background: rgba(0, 0, 0, 0.32);
    }
    .dialog h3 {
      margin: 0 0 12px;
      font-size: 17.5px;
      font-weight: 800;
      letter-spacing: -0.2px;
    }
    .dialog p {
      margin: 0 0 12px;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.5;
      color: var(--la-muted);
    }
    .field {
      display: block;
    }
    .field span {
      display: block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 1.2px;
      text-transform: uppercase;
      color: var(--la-muted);
      margin-bottom: 6px;
    }
    .field input {
      width: 100%;
      box-sizing: border-box;
      padding: 13px 14px;
      font: inherit;
      font-size: 15.5px;
      font-weight: 500;
      color: var(--primary-text-color);
      background: var(--la-field);
      border: 0;
      border-radius: 10px 10px 0 0;
      border-bottom: 2px solid var(--la-accent);
      outline: none;
    }
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 20px;
    }
    .spacer {
      flex: 1;
    }
  `}};x([lt({attribute:!1})],b.prototype,"hass",2),x([A()],b.prototype,"_config",2),x([A()],b.prototype,"_items",2),x([A()],b.prototype,"_availability",2),x([A()],b.prototype,"_expanded",2),x([A()],b.prototype,"_reordering",2),x([A()],b.prototype,"_menu",2),x([A()],b.prototype,"_wide",2),x([A()],b.prototype,"_dialog",2),x([A()],b.prototype,"_dragUid",2),x([A()],b.prototype,"_dropIndex",2);customElements.get(B)||customElements.define(B,b);window.customCards=window.customCards??[];window.customCards.some(s=>s.type===B)||window.customCards.push({type:B,name:"Listapp list",description:"A Listapp list with its colour, icon and progress.",preview:!0});export{b as ListAppListCard};
