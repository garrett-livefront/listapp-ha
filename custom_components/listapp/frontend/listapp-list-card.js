/*!
 * listapp-list-card — ListApp list card for Home Assistant.
 * Source and licences: https://github.com/garrett-livefront/listapp-ha (frontend/, NOTICE)
 * Bundles lit 3.3.3 (BSD-3-Clause) and icon paths from lucide (ISC).
 */
var ke=Object.defineProperty;var Se=Object.getOwnPropertyDescriptor;var x=(r,e,t,i)=>{for(var s=i>1?void 0:i?Se(e,t):e,n=r.length-1,o;n>=0;n--)(o=r[n])&&(s=(i?o(e,t,s):o(s))||s);return i&&s&&ke(e,t,s),s};var Q=globalThis,X=Q.ShadowRoot&&(Q.ShadyCSS===void 0||Q.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,gt=Symbol(),Pt=new WeakMap,j=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==gt)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(X&&e===void 0){let i=t!==void 0&&t.length===1;i&&(e=Pt.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&Pt.set(t,e))}return e}toString(){return this.cssText}},Rt=r=>new j(typeof r=="string"?r:r+"",void 0,gt),ft=(r,...e)=>{let t=r.length===1?r[0]:e.reduce((i,s,n)=>i+(o=>{if(o._$cssResult$===!0)return o.cssText;if(typeof o=="number")return o;throw Error("Value passed to 'css' function must be a 'css' function result: "+o+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+r[n+1],r[0]);return new j(t,r,gt)},Ht=(r,e)=>{if(X)r.adoptedStyleSheets=e.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(let t of e){let i=document.createElement("style"),s=Q.litNonce;s!==void 0&&i.setAttribute("nonce",s),i.textContent=t.cssText,r.appendChild(i)}},vt=X?r=>r:r=>r instanceof CSSStyleSheet?(e=>{let t="";for(let i of e.cssRules)t+=i.cssText;return Rt(t)})(r):r;var{is:Ie,defineProperty:Pe,getOwnPropertyDescriptor:Re,getOwnPropertyNames:He,getOwnPropertySymbols:Ue,getPrototypeOf:De}=Object,tt=globalThis,Ut=tt.trustedTypes,Le=Ut?Ut.emptyScript:"",Ne=tt.reactiveElementPolyfillSupport,K=(r,e)=>r,q={toAttribute(r,e){switch(e){case Boolean:r=r?Le:null;break;case Object:case Array:r=r==null?r:JSON.stringify(r)}return r},fromAttribute(r,e){let t=r;switch(e){case Boolean:t=r!==null;break;case Number:t=r===null?null:Number(r);break;case Object:case Array:try{t=JSON.parse(r)}catch{t=null}}return t}},et=(r,e)=>!Ie(r,e),Dt={attribute:!0,type:String,converter:q,reflect:!1,useDefault:!1,hasChanged:et};Symbol.metadata??=Symbol("metadata"),tt.litPropertyMetadata??=new WeakMap;var T=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=Dt){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let i=Symbol(),s=this.getPropertyDescriptor(e,i,t);s!==void 0&&Pe(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){let{get:s,set:n}=Re(this.prototype,e)??{get(){return this[t]},set(o){this[t]=o}};return{get:s,set(o){let l=s?.call(this);n?.call(this,o),this.requestUpdate(e,l,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??Dt}static _$Ei(){if(this.hasOwnProperty(K("elementProperties")))return;let e=De(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(K("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(K("properties"))){let t=this.properties,i=[...He(t),...Ue(t)];for(let s of i)this.createProperty(s,t[s])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[i,s]of t)this.elementProperties.set(i,s)}this._$Eh=new Map;for(let[t,i]of this.elementProperties){let s=this._$Eu(t,i);s!==void 0&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let i=new Set(e.flat(1/0).reverse());for(let s of i)t.unshift(vt(s))}else e!==void 0&&t.push(vt(e));return t}static _$Eu(e,t){let i=t.attribute;return i===!1?void 0:typeof i=="string"?i:typeof e=="string"?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Ht(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){let i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(s!==void 0&&i.reflect===!0){let n=(i.converter?.toAttribute!==void 0?i.converter:q).toAttribute(t,i.type);this._$Em=e,n==null?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(e,t){let i=this.constructor,s=i._$Eh.get(e);if(s!==void 0&&this._$Em!==s){let n=i.getPropertyOptions(s),o=typeof n.converter=="function"?{fromAttribute:n.converter}:n.converter?.fromAttribute!==void 0?n.converter:q;this._$Em=s;let l=o.fromAttribute(t,n.type);this[s]=l??this._$Ej?.get(s)??l,this._$Em=null}}requestUpdate(e,t,i,s=!1,n){if(e!==void 0){let o=this.constructor;if(s===!1&&(n=this[e]),i??=o.getPropertyOptions(e),!((i.hasChanged??et)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),n!==!0||o!==void 0)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),s===!0&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,n]of this._$Ep)this[s]=n;this._$Ep=void 0}let i=this.constructor.elementProperties;if(i.size>0)for(let[s,n]of i){let{wrapped:o}=n,l=this[s];o!==!0||this._$AL.has(s)||l===void 0||this.C(s,void 0,n,l)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(t)):this._$EM()}catch(i){throw e=!1,this._$EM(),i}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(e){}firstUpdated(e){}};T.elementStyles=[],T.shadowRootOptions={mode:"open"},T[K("elementProperties")]=new Map,T[K("finalized")]=new Map,Ne?.({ReactiveElement:T}),(tt.reactiveElementVersions??=[]).push("2.1.2");var bt=globalThis,Lt=r=>r,it=bt.trustedTypes,Nt=it?it.createPolicy("lit-html",{createHTML:r=>r}):void 0,yt="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,xt="?"+M,Oe=`<${xt}>`,H=document,W=()=>H.createComment(""),G=r=>r===null||typeof r!="object"&&typeof r!="function",$t=Array.isArray,Kt=r=>$t(r)||typeof r?.[Symbol.iterator]=="function",_t=`[ 	
\f\r]`,F=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Ot=/-->/g,Vt=/>/g,P=RegExp(`>|${_t}(?:([^\\s"'>=/]+)(${_t}*=${_t}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),Bt=/'/g,zt=/"/g,qt=/^(?:script|style|textarea|title)$/i,At=r=>(e,...t)=>({_$litType$:r,strings:e,values:t}),m=At(1),Ft=At(2),yi=At(3),_=Symbol.for("lit-noChange"),h=Symbol.for("lit-nothing"),jt=new WeakMap,R=H.createTreeWalker(H,129);function Wt(r,e){if(!$t(r)||!r.hasOwnProperty("raw"))throw Error("invalid template strings array");return Nt!==void 0?Nt.createHTML(e):e}var Gt=(r,e)=>{let t=r.length-1,i=[],s,n=e===2?"<svg>":e===3?"<math>":"",o=F;for(let l=0;l<t;l++){let a=r[l],g,f,d=-1,u=0;for(;u<a.length&&(o.lastIndex=u,f=o.exec(a),f!==null);)u=o.lastIndex,o===F?f[1]==="!--"?o=Ot:f[1]!==void 0?o=Vt:f[2]!==void 0?(qt.test(f[2])&&(s=RegExp("</"+f[2],"g")),o=P):f[3]!==void 0&&(o=P):o===P?f[0]===">"?(o=s??F,d=-1):f[1]===void 0?d=-2:(d=o.lastIndex-f[2].length,g=f[1],o=f[3]===void 0?P:f[3]==='"'?zt:Bt):o===zt||o===Bt?o=P:o===Ot||o===Vt?o=F:(o=P,s=void 0);let p=o===P&&r[l+1].startsWith("/>")?" ":"";n+=o===F?a+Oe:d>=0?(i.push(g),a.slice(0,d)+yt+a.slice(d)+M+p):a+M+(d===-2?l:p)}return[Wt(r,n+(r[t]||"<?>")+(e===2?"</svg>":e===3?"</math>":"")),i]},Y=class r{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let n=0,o=0,l=e.length-1,a=this.parts,[g,f]=Gt(e,t);if(this.el=r.createElement(g,i),R.currentNode=this.el.content,t===2||t===3){let d=this.el.content.firstChild;d.replaceWith(...d.childNodes)}for(;(s=R.nextNode())!==null&&a.length<l;){if(s.nodeType===1){if(s.hasAttributes())for(let d of s.getAttributeNames())if(d.endsWith(yt)){let u=f[o++],p=s.getAttribute(d).split(M),v=/([.?@])?(.*)/.exec(u);a.push({type:1,index:n,name:v[2],strings:p,ctor:v[1]==="."?st:v[1]==="?"?nt:v[1]==="@"?ot:D}),s.removeAttribute(d)}else d.startsWith(M)&&(a.push({type:6,index:n}),s.removeAttribute(d));if(qt.test(s.tagName)){let d=s.textContent.split(M),u=d.length-1;if(u>0){s.textContent=it?it.emptyScript:"";for(let p=0;p<u;p++)s.append(d[p],W()),R.nextNode(),a.push({type:2,index:++n});s.append(d[u],W())}}}else if(s.nodeType===8)if(s.data===xt)a.push({type:2,index:n});else{let d=-1;for(;(d=s.data.indexOf(M,d+1))!==-1;)a.push({type:7,index:n}),d+=M.length-1}n++}}static createElement(e,t){let i=H.createElement("template");return i.innerHTML=e,i}};function U(r,e,t=r,i){if(e===_)return e;let s=i!==void 0?t._$Co?.[i]:t._$Cl,n=G(e)?void 0:e._$litDirective$;return s?.constructor!==n&&(s?._$AO?.(!1),n===void 0?s=void 0:(s=new n(r),s._$AT(r,t,i)),i!==void 0?(t._$Co??=[])[i]=s:t._$Cl=s),s!==void 0&&(e=U(r,s._$AS(r,e.values),s,i)),e}var rt=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:i}=this._$AD,s=(e?.creationScope??H).importNode(t,!0);R.currentNode=s;let n=R.nextNode(),o=0,l=0,a=i[0];for(;a!==void 0;){if(o===a.index){let g;a.type===2?g=new V(n,n.nextSibling,this,e):a.type===1?g=new a.ctor(n,a.name,a.strings,this,e):a.type===6&&(g=new at(n,this,e)),this._$AV.push(g),a=i[++l]}o!==a?.index&&(n=R.nextNode(),o++)}return R.currentNode=H,s}p(e){let t=0;for(let i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}},V=class r{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,s){this.type=2,this._$AH=h,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=U(this,e,t),G(e)?e===h||e==null||e===""?(this._$AH!==h&&this._$AR(),this._$AH=h):e!==this._$AH&&e!==_&&this._(e):e._$litType$!==void 0?this.$(e):e.nodeType!==void 0?this.T(e):Kt(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==h&&G(this._$AH)?this._$AA.nextSibling.data=e:this.T(H.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:i}=e,s=typeof i=="number"?this._$AC(e):(i.el===void 0&&(i.el=Y.createElement(Wt(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(t);else{let n=new rt(s,this),o=n.u(this.options);n.p(t),this.T(o),this._$AH=n}}_$AC(e){let t=jt.get(e.strings);return t===void 0&&jt.set(e.strings,t=new Y(e)),t}k(e){$t(this._$AH)||(this._$AH=[],this._$AR());let t=this._$AH,i,s=0;for(let n of e)s===t.length?t.push(i=new r(this.O(W()),this.O(W()),this,this.options)):i=t[s],i._$AI(n),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let i=Lt(e).nextSibling;Lt(e).remove(),e=i}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},D=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,s,n){this.type=1,this._$AH=h,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=n,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=h}_$AI(e,t=this,i,s){let n=this.strings,o=!1;if(n===void 0)e=U(this,e,t,0),o=!G(e)||e!==this._$AH&&e!==_,o&&(this._$AH=e);else{let l=e,a,g;for(e=n[0],a=0;a<n.length-1;a++)g=U(this,l[i+a],t,a),g===_&&(g=this._$AH[a]),o||=!G(g)||g!==this._$AH[a],g===h?e=h:e!==h&&(e+=(g??"")+n[a+1]),this._$AH[a]=g}o&&!s&&this.j(e)}j(e){e===h?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}},st=class extends D{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===h?void 0:e}},nt=class extends D{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==h)}},ot=class extends D{constructor(e,t,i,s,n){super(e,t,i,s,n),this.type=5}_$AI(e,t=this){if((e=U(this,e,t,0)??h)===_)return;let i=this._$AH,s=e===h&&i!==h||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==h&&(i===h||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},at=class{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){U(this,e)}},Yt={M:yt,P:M,A:xt,C:1,L:Gt,R:rt,D:Kt,V:U,I:V,H:D,N:nt,U:ot,B:st,F:at},Ve=bt.litHtmlPolyfillSupport;Ve?.(Y,V),(bt.litHtmlVersions??=[]).push("3.3.3");var Zt=(r,e,t)=>{let i=t?.renderBefore??e,s=i._$litPart$;if(s===void 0){let n=t?.renderBefore??null;i._$litPart$=s=new V(e.insertBefore(W(),n),n,void 0,t??{})}return s._$AI(r),s};var wt=globalThis,k=class extends T{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Zt(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return _}};k._$litElement$=!0,k.finalized=!0,wt.litElementHydrateSupport?.({LitElement:k});var Be=wt.litElementPolyfillSupport;Be?.({LitElement:k});(wt.litElementVersions??=[]).push("4.2.2");var ze={attribute:!0,type:String,converter:q,reflect:!1,hasChanged:et},je=(r=ze,e,t)=>{let{kind:i,metadata:s}=t,n=globalThis.litPropertyMetadata.get(s);if(n===void 0&&globalThis.litPropertyMetadata.set(s,n=new Map),i==="setter"&&((r=Object.create(r)).wrapped=!0),n.set(t.name,r),i==="accessor"){let{name:o}=t;return{set(l){let a=e.get.call(this);e.set.call(this,l),this.requestUpdate(o,a,r,!0,l)},init(l){return l!==void 0&&this.C(o,void 0,r,l),l}}}if(i==="setter"){let{name:o}=t;return function(l){let a=this[o];e.call(this,l),this.requestUpdate(o,a,r,!0,l)}}throw Error("Unsupported decorator location: "+i)};function lt(r){return(e,t)=>typeof t=="object"?je(r,e,t):((i,s,n)=>{let o=s.hasOwnProperty(n);return s.constructor.createProperty(n,i),o?Object.getOwnPropertyDescriptor(s,n):void 0})(r,e,t)}function A(r){return lt({...r,state:!0,attribute:!1})}var S={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},E=r=>(...e)=>({_$litDirective$:r,values:e}),w=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}};var ct=E(class extends w{constructor(r){if(super(r),r.type!==S.ATTRIBUTE||r.name!=="class"||r.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(r){return" "+Object.keys(r).filter(e=>r[e]).join(" ")+" "}update(r,[e]){if(this.st===void 0){this.st=new Set,r.strings!==void 0&&(this.nt=new Set(r.strings.join(" ").split(/\s/).filter(i=>i!=="")));for(let i in e)e[i]&&!this.nt?.has(i)&&this.st.add(i);return this.render(e)}let t=r.element.classList;for(let i of this.st)i in e||(t.remove(i),this.st.delete(i));for(let i in e){let s=!!e[i];s===this.st.has(i)||this.nt?.has(i)||(s?(t.add(i),this.st.add(i)):(t.remove(i),this.st.delete(i)))}return _}});var{I:Ke}=Yt,Jt=r=>r;var Qt=()=>document.createComment(""),B=(r,e,t)=>{let i=r._$AA.parentNode,s=e===void 0?r._$AB:e._$AA;if(t===void 0){let n=i.insertBefore(Qt(),s),o=i.insertBefore(Qt(),s);t=new Ke(n,o,r,r.options)}else{let n=t._$AB.nextSibling,o=t._$AM,l=o!==r;if(l){let a;t._$AQ?.(r),t._$AM=r,t._$AP!==void 0&&(a=r._$AU)!==o._$AU&&t._$AP(a)}if(n!==s||l){let a=t._$AA;for(;a!==n;){let g=Jt(a).nextSibling;Jt(i).insertBefore(a,s),a=g}}}return t},I=(r,e,t=r)=>(r._$AI(e,t),r),qe={},Xt=(r,e=qe)=>r._$AH=e,te=r=>r._$AH,ht=r=>{r._$AR(),r._$AA.remove()};var ee=(r,e,t)=>{let i=new Map;for(let s=e;s<=t;s++)i.set(r[s],s);return i},ie=E(class extends w{constructor(r){if(super(r),r.type!==S.CHILD)throw Error("repeat() can only be used in text expressions")}dt(r,e,t){let i;t===void 0?t=e:e!==void 0&&(i=e);let s=[],n=[],o=0;for(let l of r)s[o]=i?i(l,o):o,n[o]=t(l,o),o++;return{values:n,keys:s}}render(r,e,t){return this.dt(r,e,t).values}update(r,[e,t,i]){let s=te(r),{values:n,keys:o}=this.dt(e,t,i);if(!Array.isArray(s))return this.ut=o,n;let l=this.ut??=[],a=[],g,f,d=0,u=s.length-1,p=0,v=n.length-1;for(;d<=u&&p<=v;)if(s[d]===null)d++;else if(s[u]===null)u--;else if(l[d]===o[p])a[p]=I(s[d],n[p]),d++,p++;else if(l[u]===o[v])a[v]=I(s[u],n[v]),u--,v--;else if(l[d]===o[v])a[v]=I(s[d],n[v]),B(r,a[v+1],s[d]),d++,v--;else if(l[u]===o[p])a[p]=I(s[u],n[p]),B(r,s[d],s[u]),u--,p++;else if(g===void 0&&(g=ee(o,p,v),f=ee(l,d,u)),g.has(l[d]))if(g.has(l[u])){let $=f.get(o[p]),y=$!==void 0?s[$]:null;if(y===null){let It=B(r,s[d]);I(It,n[p]),a[p]=It}else a[p]=I(y,n[p]),B(r,s[d],y),s[$]=null;p++}else ht(s[u]),u--;else ht(s[d]),d++;for(;p<=v;){let $=B(r,a[v+1]);I($,n[p]),a[p++]=$}for(;d<=u;){let $=s[d++];$!==null&&ht($)}return this.ut=o,Xt(r,a),_}});var re="important",Fe=" !"+re,Et=E(class extends w{constructor(r){if(super(r),r.type!==S.ATTRIBUTE||r.name!=="style"||r.strings?.length>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(r){return Object.keys(r).reduce((e,t)=>{let i=r[t];return i==null?e:e+`${t=t.includes("-")?t:t.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${i};`},"")}update(r,[e]){let{style:t}=r.element;if(this.ft===void 0)return this.ft=new Set(Object.keys(e)),this.render(e);for(let i of this.ft)e[i]==null&&(this.ft.delete(i),i.includes("-")?t.removeProperty(i):t[i]=null);for(let i in e){let s=e[i];if(s!=null){this.ft.add(i);let n=typeof s=="string"&&s.endsWith(Fe);i.includes("-")||n?t.setProperty(i,n?s.slice(0,-11):s,n?re:""):t[i]=s}}return _}});var se=["#f59e0b","#14b8a6","#6366f1","#ec4899","#0ea5e9","#22c55e"];function We(r){let e=0;for(let t=0;t<r.length;t++)e=e*31+r.charCodeAt(t)|0;return se[Math.abs(e)%se.length]}var Ct="#03a9f4",Ge="#ffffff",Ye="#1c1917",Ze=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;function pt(r){let e=Ze.exec(r.trim());if(!e)return null;let t=e[1];t.length===3&&(t=t.split("").map(s=>s+s).join(""));let i=parseInt(t,16);return[i>>16&255,i>>8&255,i&255]}function ne(r){let e=pt(r);if(e)return e;let t=/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(r.trim());return t?[Number(t[1]),Number(t[2]),Number(t[3])].map(i=>Math.max(0,Math.min(255,Math.round(i)))):null}function ut([r,e,t]){return"#"+[r,e,t].map(i=>i.toString(16).padStart(2,"0")).join("")}function oe([r,e,t]){let i=s=>{let n=s/255;return n<=.03928?n/12.92:((n+.055)/1.055)**2.4};return .2126*i(r)+.7152*i(e)+.0722*i(t)}function ae(r,e){let t=oe(r),i=oe(e);return(Math.max(t,i)+.05)/(Math.min(t,i)+.05)}function le(r,e,t){return r.map((i,s)=>Math.round(i+(e[s]-i)*t))}var Je=(r,e)=>le(r,[255,255,255],e),Qe=(r,e)=>le(r,[0,0,0],e);function de(r,e){return typeof r=="string"&&pt(r)?ut(pt(r)):We(e??"")}var Xe=3,ti=4.5,ei=.38;function ii(r){return ae([255,255,255],r)>=Xe?Ge:Ye}function ri(r,e,t){if(t)return ut(Je(r,ei));let i=r;for(let s=0;s<8&&ae(i,e)<ti;s++)i=Qe(i,.12);return ut(i)}function si(r,e){let[t,i,s]=r;return`rgba(${t}, ${i}, ${s}, ${e?.18:.1})`}function ce(r,e,t){let i=ne(r)??pt(Ct),s=ne(e)??(t?[28,28,28]:[255,255,255]);return{accent:ut(i),glyph:ii(i),ink:ri(i,s,t),tint:si(i,t)}}var z="listapp-list-card",Z=(r,e)=>typeof r=="boolean"?r:e;function he(r){if(!r||typeof r!="object")throw new Error("Invalid configuration");if(typeof r.entity!="string"||r.entity.split(".")[0]!=="todo")throw new Error("Specify an entity from within the todo domain");if(r.item_tap_action!==void 0&&r.item_tap_action!=="toggle"&&r.item_tap_action!=="edit")throw new Error("item_tap_action must be 'toggle' or 'edit'");let e=Number(r.collapse_to??0);if(!Number.isInteger(e)||e<0)throw new Error("collapse_to must be a non-negative integer");return{entity:r.entity,title:typeof r.title=="string"&&r.title.trim()?r.title:void 0,useListColor:Z(r.use_list_color,!0),showTitle:Z(r.show_title,!0),showAdd:Z(r.show_add,!0),showCompleted:Z(r.show_completed,!0),showProgress:Z(r.show_progress,!0),collapseTo:e,itemTapAction:r.item_tap_action??"toggle"}}function pe(r){let e=r.find(t=>t.startsWith("todo.listapp_"))??r.find(t=>t.startsWith("todo."))??"";return{type:`custom:${z}`,entity:e}}var L={CREATE:1,DELETE:2,UPDATE:4,MOVE:8},ue="unavailable",me="unknown",N=(r,e)=>((r?.attributes.supported_features??0)&e)!==0,ge=(r,e,t)=>r.connection.subscribeMessage(t,{type:"todo/item/subscribe",entity_id:e}),fe=(r,e,t)=>r.callService("todo","add_item",{item:t},{entity_id:e}),ve=(r,e,t,i)=>r.callService("todo","update_item",{item:t.uid,status:i},{entity_id:e}),_e=(r,e,t,i)=>r.callService("todo","update_item",{item:t.uid,rename:i},{entity_id:e}),Tt=(r,e,t)=>r.callService("todo","remove_item",{item:t},{entity_id:e}),be=(r,e,t,i)=>r.callWS({type:"todo/item/move",entity_id:e,uid:t,previous_uid:i}),ye=(r,e)=>r.callWS({type:"config_entries/get",domain:e}),xe=r=>r.callWS({type:"config_entries/flow/progress"}),$e="/config/integrations/integration/listapp";function Ae(r){history.pushState(null,"",r),window.dispatchEvent(new CustomEvent("location-changed",{bubbles:!0,composed:!0,detail:{replace:!1}}))}var O=class extends w{constructor(e){if(super(e),this.it=h,e.type!==S.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===h||e==null)return this._t=void 0,this.it=e;if(e===_)return e;if(typeof e!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};O.directiveName="unsafeHTML",O.resultType=1;var Rr=E(O);var J=class extends O{};J.directiveName="unsafeSVG",J.resultType=2;var we=E(J);var mt={"list-checks":'<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>',star:'<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',heart:'<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/>',sparkles:'<path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/>',gift:'<path d="M12 7v14"/><path d="M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5"/><rect x="3" y="7" width="18" height="4" rx="1"/>',home:'<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',"shopping-cart":'<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"/><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',"shopping-bag":'<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',utensils:'<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>',coffee:'<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',cake:'<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',plane:'<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',car:'<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>',"map-pin":'<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',luggage:'<path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2"/><path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14"/><path d="M10 20h4"/><circle cx="16" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',backpack:'<path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>',briefcase:'<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',"dollar-sign":'<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',"book-open":'<path d="M12 5v16"/><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>',"graduation-cap":'<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',dumbbell:'<path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z"/><path d="m2.5 21.5 1.4-1.4"/><path d="m20.1 3.9 1.4-1.4"/><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z"/><path d="m9.6 14.4 4.8-4.8"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',"party-popper":'<path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',"paw-print":'<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',baby:'<path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M15 12h.01"/><path d="M19.38 6.813A9 9 0 0 1 20.8 10.2a2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/><path d="M9 12h.01"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z"/>'},Ee={plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',check:'<path d="M20 6 9 17l-5-5"/>',"ellipsis-vertical":'<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',"circle-check":'<circle cx="12" cy="12" r="10"/><path d="m16 9-5.5 5.5L8 12"/>',"triangle-alert":'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',"cloud-off":'<path d="M10.94 5.274A7 7 0 0 1 15.71 10h1.79a4.5 4.5 0 0 1 4.222 6.057"/><path d="M18.796 18.81A4.5 4.5 0 0 1 17.5 19H9A7 7 0 0 1 5.79 5.78"/><path d="m2 2 20 20"/>',"grip-vertical":'<circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/>',"chevron-down":'<path d="m6 9 6 6 6-6"/>',"chevron-up":'<path d="m18 15-6-6-6 6"/>',"arrow-up":'<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',"arrow-down":'<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',trash:'<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',"list-checks":'<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>'};var ni="list-checks",Kr=Object.keys(mt);function oi(r){return r&&Object.hasOwn(mt,r)?r:ni}var Ce=(r,e)=>Ft`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width=${e} height=${e} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${we(r)}</svg>`,Mt=(r,e=20)=>Ce(mt[oi(r)],e),C=(r,e=20)=>Ce(Ee[r],e);function li(r){let e=[],t=[];for(let i of r)(i.status==="completed"?t:e).push(i);return{active:e,completed:t}}function di(r){return r?r.attributes.role==="viewer"?!0:!N(r,L.CREATE)||!N(r,L.UPDATE):!1}function ci(r,e,t){return t||e<=0||r.length<=e?{shown:r,hidden:0}:{shown:r.slice(0,e),hidden:r.length-e}}function hi(r,e,t,i=!1){return i?"Unavailable":t?`${r} ${r===1?"item":"items"} \xB7 view only`:r===0?"No items":`${e} of ${r} done`}function pi(r,e){let t=r?.attributes.friendly_name;return typeof t=="string"&&t.trim()?t:e.split(".")[1]?.replace(/^listapp_/,"").replace(/_/g," ")??e}var kt=r=>r.state===ue||r.state===me;function St(r,e,t,i="listapp"){return!r||!kt(r)?"available":t?.some(o=>o.handler===i&&o.context?.source==="reauth")||e?.some(o=>o.domain===i&&o.state==="setup_error"&&/auth|token|sign in|log in|credential/i.test(o.reason??""))?"auth":"transient"}function Te({config:r,stateObj:e,items:t,availability:i,expanded:s}){let n=di(e),o=!n&&N(e,L.CREATE),l=!n&&N(e,L.UPDATE),a=!n&&N(e,L.DELETE),g=!n&&N(e,L.MOVE),{active:f,completed:d}=li(t??[]),u=f.length+d.length,p=d.length,{shown:v,hidden:$}=ci(f,r.collapseTo,s),y;return e?i==="auth"?y="unavailable_auth":i==="transient"?y="unavailable_transient":t===void 0?y="loading":u===0?y="empty":f.length===0?y="all_done":y="list":y="missing",{state:y,viewer:n,canCreate:o,canUpdate:l,canDelete:a,canMove:g,title:r.title??pi(e,r.entity),subline:hi(u,p,n,i!=="available"),total:u,done:p,progress:u===0?0:p/u,active:f,completed:d,visibleActive:v,hiddenActive:$,showAdd:r.showAdd&&o,showCompleted:r.showCompleted,showProgress:r.showProgress}}function Me(r,e,t){let i=r.filter(o=>o.uid!==e),s=r.find(o=>o.uid===e);if(!s)return{order:r,previousUid:void 0};let n=Math.max(0,Math.min(t,i.length));return i.splice(n,0,s),{order:i,previousUid:n===0?void 0:i[n-1].uid}}var c={addPlaceholder:"Add item",addButton:"Add item",active:"Active",completed:"Completed",reorder:"Reorder items",exitReorder:"Done reordering",clearCompleted:"Clear completed",clearConfirmTitle:"Clear completed items?",clearConfirmText:r=>`This will permanently delete ${r} completed ${r===1?"item":"items"} from the list.`,cancel:"Cancel",delete:"Delete",save:"Save",editTitle:"Edit item",editLabel:"Item",emptyTitle:"Nothing on this list",emptyBody:"Add the first item above, or ask Assist to add one.",emptyBodyViewer:"Nothing has been added yet.",allDoneTitle:"All done",allDoneBody:"Every item on this list is checked off.",allDoneHidden:r=>`${r} completed ${r===1?"item is":"items are"} hidden.`,authTitle:"List unavailable",authBody:"ListApp needs you to sign in again before this list can sync.",signIn:"Sign in",transientTitle:"Can't reach ListApp right now",transientBody:"Home Assistant will keep retrying. Items you see here may be stale.",checkIntegration:"Check integration",missing:r=>`Entity not found: ${r}`,showMore:r=>`Show ${r} more`,showLess:"Show less",markDone:r=>`Mark "${r}" done`,markActive:r=>`Mark "${r}" not done`,dragHandle:r=>`Move "${r}" \u2014 drag, or use arrow keys`,menu:r=>`${r} options`};var ui=560,mi=3e4,b=class extends k{constructor(){super(...arguments);this._availability="available";this._expanded=!1;this._reordering=!1;this._menu=null;this._wide=!1;this._dialog=null;this._dragUid=null;this._dropIndex=null;this._submitAdd=async t=>{t.preventDefault();let s=t.currentTarget.elements.namedItem("summary"),n=s.value.trim();!n||!this.hass||!this._config||(s.value="",await fe(this.hass,this._config.entity,n),s.focus())};this._checkboxChanged=t=>{let i=t.currentTarget;this._toggleItem(this._item(i.dataset.uid))};this._itemTapped=t=>{let i=t.currentTarget.dataset.uid,s=this._item(i);s&&(this._config.itemTapAction==="edit"?this._dialog={kind:"edit",item:s}:this._toggleItem(s))};this._toggleExpanded=()=>{this._expanded=!this._expanded};this._toggleMenu=t=>{t.stopPropagation();let i=t.currentTarget.dataset.menu;this._menu=this._menu===i?null:i};this._onDocumentClick=()=>{this._menu&&(this._menu=null)};this._menuKeydown=t=>{t.key==="Escape"&&(this._menu=null,this.renderRoot.querySelector(".menu-btn")?.focus())};this._toggleReorder=()=>{this._reordering=!this._reordering,this._menu=null,this._reordering&&(this._expanded=!0)};this._clearCompleted=async()=>{let t=this._dialog;this._closeDialog(),t?.kind==="confirm-clear"&&this.hass&&this._config&&t.uids.length&&await Tt(this.hass,this._config.entity,t.uids)};this._closeDialog=()=>{let t=this.renderRoot.querySelector("dialog");t?.open&&t.close(),this._dialog=null};this._saveEdit=async t=>{t.preventDefault();let i=this._dialog,n=t.currentTarget.elements.namedItem("summary").value.trim();this._closeDialog(),i?.kind==="edit"&&n&&n!==i.item.summary&&this.hass&&this._config&&await _e(this.hass,this._config.entity,i.item,n)};this._deleteFromDialog=async()=>{let t=this._dialog;this._closeDialog(),t?.kind==="edit"&&this.hass&&this._config&&await Tt(this.hass,this._config.entity,[t.item.uid])};this._signIn=()=>{Ae($e)};this._dragStart=t=>{let i=t.currentTarget;this._dragUid=i.dataset.uid??null,t.dataTransfer?.setData("text/plain",this._dragUid??""),t.dataTransfer&&(t.dataTransfer.effectAllowed="move")};this._dragOver=t=>{if(!this._dragUid)return;t.preventDefault();let i=t.target.closest("li.item");if(!i)return;let s=i.getBoundingClientRect(),n=Number(i.dataset.index);this._dropIndex=t.clientY>s.top+s.height/2?n+1:n};this._drop=t=>{t.preventDefault();let i=this._dragUid,s=this._dropIndex;if(this._dragUid=null,this._dropIndex=null,!i||s===null)return;let o=this._view().active.findIndex(a=>a.uid===i),l=s>o?s-1:s;this._move(i,l)};this._dragEnd=()=>{this._dragUid=null,this._dropIndex=null};this._handleKeydown=t=>{if(t.key!=="ArrowUp"&&t.key!=="ArrowDown")return;t.preventDefault();let i=t.currentTarget,s=i.dataset.uid,n=Number(i.dataset.index),o=t.key==="ArrowUp"?n-1:n+1,l=this._view().active;o<0||o>=l.length||this._move(s,o).then(async()=>{await this.updateComplete,this.renderRoot.querySelector(`.handle[data-uid="${s}"]`)?.focus()})}}static getStubConfig(t,i,s){return pe([...i,...s])}setConfig(t){this._config=he(t),this._expanded=!1,this._reordering=!1}getCardSize(){if(!this._config)return 3;let t=this._view(),i=t.visibleActive.length+(t.showCompleted?t.completed.length:0);return(this._config.showTitle?2:1)+(t.showAdd?1:0)+Math.ceil(i/2)+1}getGridOptions(){return{columns:12,min_columns:6,rows:"auto"}}connectedCallback(){super.connectedCallback(),this.hasUpdated&&this._subscribe(),this._resize??=new ResizeObserver(t=>{let i=t[0]?.contentRect.width??0;this._wide=i>=ui}),this._resize.observe(this),document.addEventListener("click",this._onDocumentClick)}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribe(),this._resize?.disconnect(),document.removeEventListener("click",this._onDocumentClick),this._stopAvailabilityTimer()}willUpdate(t){!this.hass||!this._config||((this._subscribedEntity!==this._config.entity||!this._unsub&&this._config.entity in this.hass.states)&&(this._items=void 0,this._subscribe()),(t.has("hass")||t.has("_config"))&&this._trackAvailability())}_stateObj(){return this.hass&&this._config?this.hass.states[this._config.entity]:void 0}_view(){return Te({config:this._config,stateObj:this._stateObj(),items:this._items,availability:this._availability,expanded:this._expanded})}_subscribe(){if(this._unsubscribe(),!this.hass||!this._config||!(this._config.entity in this.hass.states))return;let t=this._config.entity;this._subscribedEntity=t,this._unsub=ge(this.hass,t,i=>{this._items=i.items}).catch(i=>(console.warn("listapp-list-card: item subscription failed",i),()=>{}))}_unsubscribe(){this._unsub?.then(t=>t()),this._unsub=void 0,this._subscribedEntity=void 0}_trackAvailability(){let t=this._stateObj();if(!t||!kt(t)){this._availability="available",this._checkedAvailabilityFor=void 0,this._stopAvailabilityTimer();return}let i=`${t.entity_id}:${t.state}`;this._checkedAvailabilityFor!==i&&(this._checkedAvailabilityFor=i,this._availability==="available"&&(this._availability="transient"),this._checkAvailability(),this._stopAvailabilityTimer(),this._availabilityTimer=window.setInterval(()=>{this._checkAvailability()},mi))}_stopAvailabilityTimer(){this._availabilityTimer!==void 0&&(window.clearInterval(this._availabilityTimer),this._availabilityTimer=void 0)}async _checkAvailability(){if(this.hass)try{let[t,i]=await Promise.all([ye(this.hass,"listapp"),xe(this.hass)]);this._availability=St(this._stateObj(),t,i)}catch{this._availability=St(this._stateObj(),void 0,void 0)}}_resolvePalette(){let t=this._stateObj(),i=this.hass?.themes?.darkMode??window.matchMedia?.("(prefers-color-scheme: dark)").matches??!1,s=getComputedStyle(this),n=s.getPropertyValue("--card-background-color").trim()||(i?"#1c1c1c":"#ffffff"),o=this._config.useListColor?de(t?.attributes.color,t?.attributes.list_id??this._config.entity):s.getPropertyValue("--primary-color").trim()||Ct,l=`${o}|${n}|${i}`;return this._paletteKey!==l&&(this._paletteKey=l,this._palette=ce(o,n,i)),this._palette}render(){if(!this.hass||!this._config)return h;let t=this._view(),i=this._resolvePalette(),s={"--la-accent":i.accent,"--la-glyph":i.glyph,"--la-ink":i.ink,"--la-tint":i.tint};return m`
      <ha-card
        style=${Et(s)}
        class=${ct({wide:this._wide,viewer:t.viewer,reordering:this._reordering})}
      >
        ${t.state==="missing"?this._renderMissing():this._renderCard(t)}
        ${this._renderDialog(t)}
      </ha-card>
    `}_renderMissing(){return m`<div class="notice">${C("triangle-alert",22)}<span>${c.missing(this._config.entity)}</span></div>`}_renderCard(t){let i=this._stateObj(),s=t.state==="unavailable_auth"||t.state==="unavailable_transient";return m`
      ${this._config.showTitle?this._renderHeader(t,i.attributes.icon):h}
      ${t.showProgress&&!s?this._renderProgress(t):h}
      ${s?this._renderUnavailable(t):this._renderBody(t)}
    `}_renderHeader(t,i){return m`
      <header class="head">
        <div class="tile" aria-hidden="true">${Mt(i,20)}</div>
        <div class="titles">
          <h2 class="title">${t.title}</h2>
          <p class="subline">${t.subline}</p>
        </div>
      </header>
    `}_renderProgress(t){let i=Math.round(t.progress*100);return m`
      <div
        class="progress"
        role="progressbar"
        aria-label="Completed"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${i}
      >
        <div class="progress-fill" style=${Et({width:`${i}%`})}></div>
      </div>
    `}_renderUnavailable(t){let i=t.state==="unavailable_auth";return m`
      <div class="state">
        <div class="state-icon warn">${C(i?"triangle-alert":"cloud-off",26)}</div>
        <h3>${i?c.authTitle:c.transientTitle}</h3>
        <p>${i?c.authBody:c.transientBody}</p>
        ${i?m`<button class="primary" @click=${this._signIn}>${c.signIn}</button>`:m`<button class="link" @click=${this._signIn}>${c.checkIntegration}</button>`}
      </div>
    `}_renderBody(t){return m`
      ${t.showAdd?this._renderAdd():h}
      ${t.state==="loading"?h:this._renderSections(t)}
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
        <button type="submit" class="icon-btn add-btn" title=${c.addButton} aria-label=${c.addButton}>
          ${C("plus",22)}
        </button>
      </form>
    `}_renderSections(t){if(t.state==="empty")return m`
        <div class="state">
          <div class="state-icon">${Mt(this._stateObj()?.attributes.icon,26)}</div>
          <h3>${c.emptyTitle}</h3>
          <p>${t.showAdd?c.emptyBody:c.emptyBodyViewer}</p>
        </div>
      `;let i=this._reordering?c.reorder:c.active;return m`
      ${t.state==="all_done"?m`
            <div class="state">
              <div class="state-icon done">${C("circle-check",26)}</div>
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
                    <button class="link more" @click=${this._toggleExpanded} aria-expanded=${this._expanded}>
                      ${C(this._expanded?"chevron-up":"chevron-down",18)}
                      ${this._expanded?c.showLess:c.showMore(t.hiddenActive)}
                    </button>
                  `:h}
            </section>
          `}
      ${t.showCompleted&&t.completed.length&&!this._reordering?m`
            <div class="divider" role="separator"></div>
            <section class="section" aria-label=${c.completed}>
              <div class="section-head">
                <h3>${c.completed}<span class="count"> · ${t.completed.length}</span></h3>
                ${t.canDelete?this._renderMenu("completed",t):h}
              </div>
              ${this._renderItems(t.completed,t,!1)}
            </section>
          `:h}
    `}_renderMenu(t,i){let s=this._menu===t,n=t==="active"?c.active:c.completed;return m`
      <div class="menu-wrap">
        <button
          class="icon-btn menu-btn"
          aria-haspopup="menu"
          aria-expanded=${s}
          aria-label=${c.menu(n)}
          title=${c.menu(n)}
          data-menu=${t}
          @click=${this._toggleMenu}
        >
          ${C("ellipsis-vertical",20)}
        </button>
        ${s?m`
              <div class="menu" role="menu" @keydown=${this._menuKeydown}>
                ${t==="active"?m`<button role="menuitem" @click=${this._toggleReorder}>
                      ${this._reordering?c.exitReorder:c.reorder}
                    </button>`:m`<button role="menuitem" class="danger" @click=${()=>this._confirmClear(i)}>
                      ${C("trash",18)} ${c.clearCompleted}
                    </button>`}
              </div>
            `:h}
      </div>
    `}_renderItems(t,i,s){let n=this._reordering&&s&&i.canMove;return m`
      <ul
        class=${ct({items:!0,reorder:n})}
        @dragover=${n?this._dragOver:h}
        @drop=${n?this._drop:h}
      >
        ${ie(t,o=>o.uid,(o,l)=>this._renderItem(o,l,i,n))}
      </ul>
    `}_renderItem(t,i,s,n){let o=t.status==="completed",l=s.canUpdate,a=o?c.markActive(t.summary):c.markDone(t.summary);return m`
      <li
        class=${ct({item:!0,done:o,interactive:l,dragging:this._dragUid===t.uid,"drop-before":this._dropIndex===i&&this._dragUid!==t.uid})}
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
            .disabled=${!l}
            aria-label=${a}
            data-uid=${t.uid}
            @change=${this._checkboxChanged}
          />
          <span class="box" aria-hidden="true">${C("check",14)}</span>
        </label>
        ${l?m`<button class="summary" data-uid=${t.uid} @click=${this._itemTapped}>${t.summary}</button>`:m`<span class="summary">${t.summary}</span>`}
        ${n?m`
              <button
                class="icon-btn handle"
                aria-label=${c.dragHandle(t.summary)}
                title=${c.dragHandle(t.summary)}
                data-uid=${t.uid}
                data-index=${i}
                @keydown=${this._handleKeydown}
              >
                ${C("grip-vertical",20)}
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
    `:h}updated(t){if(t.has("_dialog")&&this._dialog){let i=this.renderRoot.querySelector("dialog");i&&!i.open&&(i.showModal(),i.querySelector("input")?.select())}}_item(t){return t?this._items?.find(i=>i.uid===t):void 0}async _toggleItem(t){if(!t||!this.hass||!this._config)return;let i=t.status==="completed"?"needs_action":"completed";await ve(this.hass,this._config.entity,t,i)}_confirmClear(t){this._menu=null,this._dialog={kind:"confirm-clear",uids:t.completed.map(i=>i.uid)}}async _move(t,i){if(!this.hass||!this._config||!this._items)return;let{active:s,completed:n}=this._view(),{order:o,previousUid:l}=Me(s,t,i);this._items=[...o,...n],await be(this.hass,this._config.entity,t,l)}static{this.styles=ft`
    :host {
      display: block;
    }
    ha-card {
      display: block;
      position: relative;
      height: 100%;
      box-sizing: border-box;
      padding-bottom: 8px;
      color: var(--primary-text-color);
      font-family: var(--ha-card-font-family, var(--paper-font-body1_-_font-family, inherit));
      --la-target: 44px;
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
    .viewer button.summary,
    .viewer .check {
      cursor: default;
    }

    .head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 16px 12px;
    }
    .tile {
      flex: none;
      width: 40px;
      height: 40px;
      border-radius: 10px;
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
      font-size: var(--ha-card-header-font-size, 1.25rem);
      font-weight: 500;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .subline {
      margin: 2px 0 0;
      font-size: 0.85rem;
      color: var(--secondary-text-color);
    }

    .progress {
      height: 4px;
      margin: 0 16px 4px;
      border-radius: 2px;
      background: var(--la-tint);
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      border-radius: 2px;
      background: var(--la-accent);
      transition: width 200ms ease;
    }

    .add {
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 8px 16px 4px;
      border-bottom: 2px solid var(--la-accent);
    }
    .add-input {
      flex: 1;
      min-width: 0;
      height: var(--la-target);
      padding: 0 4px;
      font: inherit;
      color: var(--primary-text-color);
      background: transparent;
      border: 0;
      outline: none;
    }
    .add-input::placeholder {
      color: var(--secondary-text-color);
    }
    .add-btn {
      color: var(--la-ink);
    }
    .icon-btn {
      width: var(--la-target);
      height: var(--la-target);
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: var(--secondary-text-color);
    }
    .icon-btn:hover {
      background: var(--la-tint);
    }

    .section {
      padding: 4px 0 0;
    }
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 36px;
      padding: 0 8px 0 16px;
    }
    .section-head h3 {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--secondary-text-color);
    }
    .count {
      font-weight: 400;
    }
    .divider {
      height: 1px;
      margin: 8px 16px 0;
      background: var(--divider-color);
    }

    .items {
      list-style: none;
      margin: 0;
      padding: 0 8px;
    }
    .wide .items {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 8px;
    }
    .item {
      position: relative;
      display: flex;
      align-items: center;
      min-height: var(--la-target);
      border-radius: 8px;
    }
    .item.interactive:hover {
      background: var(--la-tint);
    }
    .check {
      flex: none;
      position: relative;
      width: var(--la-target);
      height: var(--la-target);
      display: grid;
      place-items: center;
      cursor: pointer;
    }
    .check input {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }
    .check input:disabled {
      cursor: default;
    }
    .box {
      width: 20px;
      height: 20px;
      box-sizing: border-box;
      border-radius: 5px;
      border: 2px solid var(--secondary-text-color);
      display: grid;
      place-items: center;
      color: transparent;
      transition:
        background 120ms ease,
        border-color 120ms ease;
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
      min-height: var(--la-target);
      display: flex;
      align-items: center;
      padding: 8px 12px 8px 0;
      text-align: left;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }
    .done .summary {
      color: var(--secondary-text-color);
      text-decoration: line-through;
    }
    .handle {
      cursor: grab;
      color: var(--secondary-text-color);
    }
    .reorder .item {
      border: 1px dashed transparent;
    }
    .reorder .item.dragging {
      opacity: 0.4;
    }
    .reorder .item.drop-before {
      box-shadow: inset 0 2px 0 var(--la-accent);
    }

    .link,
    .more {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 36px;
      padding: 0 12px;
      border-radius: 18px;
      color: var(--la-ink);
      font-weight: 500;
    }
    .more {
      margin: 2px 8px 0;
    }
    .link:hover,
    .more:hover {
      background: var(--la-tint);
    }

    .menu-wrap {
      position: relative;
    }
    .menu {
      position: absolute;
      top: calc(100% - 4px);
      right: 0;
      z-index: 2;
      min-width: 200px;
      padding: 4px 0;
      border-radius: var(--ha-card-border-radius, 12px);
      background: var(--card-background-color, #fff);
      box-shadow: var(--ha-card-box-shadow, 0 4px 16px rgba(0, 0, 0, 0.24));
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
    }
    .menu button:hover {
      background: var(--la-tint);
    }
    .danger {
      color: var(--error-color, #db4437);
    }

    .state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 20px 24px 16px;
    }
    .state-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--la-tint);
      color: var(--la-ink);
    }
    .state-icon.warn {
      background: rgba(255, 152, 0, 0.14);
      color: var(--warning-color, #ff9800);
    }
    .state h3 {
      margin: 12px 0 4px;
      font-size: 1rem;
      font-weight: 500;
    }
    .state p {
      margin: 0 0 12px;
      color: var(--secondary-text-color);
      font-size: 0.9rem;
      max-width: 36ch;
    }
    .notice {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      color: var(--warning-color, #ff9800);
    }

    .primary {
      min-height: 36px;
      padding: 0 20px;
      border-radius: 18px;
      background: var(--la-accent);
      color: var(--la-glyph);
      font-weight: 500;
    }
    .primary.danger-bg {
      background: var(--error-color, #db4437);
      color: #fff;
    }
    .text {
      min-height: 36px;
      padding: 0 12px;
      border-radius: 18px;
      color: var(--la-ink);
      font-weight: 500;
    }
    .text:hover,
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
      font-size: 1.25rem;
      font-weight: 500;
    }
    .dialog p {
      margin: 0 0 12px;
      color: var(--secondary-text-color);
    }
    .field {
      display: block;
    }
    .field span {
      display: block;
      font-size: 0.8rem;
      color: var(--secondary-text-color);
      margin-bottom: 4px;
    }
    .field input {
      width: 100%;
      box-sizing: border-box;
      height: var(--la-target);
      padding: 0 8px;
      font: inherit;
      color: var(--primary-text-color);
      background: transparent;
      border: 0;
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
  `}};x([lt({attribute:!1})],b.prototype,"hass",2),x([A()],b.prototype,"_config",2),x([A()],b.prototype,"_items",2),x([A()],b.prototype,"_availability",2),x([A()],b.prototype,"_expanded",2),x([A()],b.prototype,"_reordering",2),x([A()],b.prototype,"_menu",2),x([A()],b.prototype,"_wide",2),x([A()],b.prototype,"_dialog",2),x([A()],b.prototype,"_dragUid",2),x([A()],b.prototype,"_dropIndex",2);customElements.get(z)||customElements.define(z,b);window.customCards=window.customCards??[];window.customCards.some(r=>r.type===z)||window.customCards.push({type:z,name:"ListApp list",description:"A ListApp list with its colour, icon and progress.",preview:!0});export{b as ListAppListCard};
