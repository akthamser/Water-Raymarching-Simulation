#version 330 core

uniform vec2 u_resolution;
uniform float u_time;

uniform samplerCube skybox; // 0

out vec4 FragColor;

#define FREQ_INITIAL .15     // Starting frequency
#define AMP_INITIAL 1.0        // Starting amplitude
#define WAVES_ITERATIONS 32      // Number of iterations for FBM
#define FREQ_MULTIPLIER 1.15   // Frequency multiplier for each octave
#define AMP_MULTIPLIER 0.82    // Amplitude multiplier for each octave
#define ANALYTICAL_NORMAL 1  // Use analytical normals if false numerical normals




mat2 rot2D(float angle){
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c,-s,s,c);
}

vec4 wave(vec2 p, vec2 dir, float freq, float time){
    float x = dot(p, dir) * freq + time;
    float res = exp(sin(x) - 1);
    float dx = res * cos(x);

    float ddx = 0;
    float ddy = 0;
#if ANALYTICAL_NORMAL
    ddx = res * cos(x) * freq * dir.x; // x derivitve 
    ddy = res * cos(x) * freq * dir.y; // z derivitve 
#endif

    return vec4(res, dx, ddx, ddy);
}

vec4 map(vec3 p){     
    float height = 0;
    float amp = AMP_INITIAL;  // Start amplitude
    float freq = FREQ_INITIAL; // Start frequency
    float n = 0;
    float ampSum = 0;
    float time = 8;
    float ddx = 0;  
    float ddy = 0;

    for(int k = 0; k < WAVES_ITERATIONS; k++){
        vec2 dir = vec2(cos(n), sin(n));
        vec4 waveResult = wave(p.xz, dir, freq, u_time * time);

        p.xz += dir * waveResult.y * amp * 0.4;
        ddx += waveResult.z * amp;
        ddy += waveResult.w * amp;

        height += waveResult.x * amp;
        ampSum += amp;

        // Adjust amplitude and frequency for each iteration
        amp *= AMP_MULTIPLIER;  
        freq *= FREQ_MULTIPLIER;

        n += 13298.693;
        time *= 1.07;
    }

    return vec4(p.y + height / ampSum, 1, ddx / ampSum, ddy / ampSum);
}


vec3 NormalAnalytical(vec4 inter) {

   
    vec3 B = vec3(0,-inter.w,1);
    vec3 T = vec3(1,-inter.z,0);
    vec3 crossproduct = cross(B,T);
    return normalize(crossproduct) ;
        
}

vec3 NormalNumerical(vec3 p) {
    vec3 e = vec3(0.0001, 0, 0);//epsilon
    vec3 n;
    n.x = map(p + e.xyy).x - map(p - e.xyy).x;
    n.y = map(p + e.yxy).x - map(p - e.yxy).x;
    n.z = map(p + e.yyx).x - map(p - e.yyx).x;
    return normalize(n);
        
}

vec4 intersect(vec3 ro ,vec3 rd){

    float t = 0;
    for(int i=0;i<128;i++){

        
        vec3 p = ro + rd * t;

        vec4 c = map(p);
        float d = c.x;
        
        t += d;
    if(d < .01) return vec4(t,c.yzw);
    if(t >  50.) break;
        
    }
    return vec4(50,-1,-1,-1);
}



void main() {
    vec2 uv = (2 * gl_FragCoord.xy - u_resolution) / u_resolution.y;

    vec3 ro = vec3(0,clamp(0.5 + u_time*3,0.5,4),-3);
    vec3 rd = normalize(vec3(uv*0.5,1));

 

    rd.yz *= rot2D(0.2 + clamp(-u_time*0.4,-0.2,0));
    rd.xz *= rot2D(-0.6 + clamp(u_time*1.1,0,0.6));


    vec3 col = vec3(0.0);

    


    vec4 inter = intersect(ro,rd);
    vec3 p = ro + inter.x * rd;

#if ANALYTICAL_NORMAL
    vec3 nor = NormalAnalytical(inter);
#else
    vec3 nor = NormalNumerical(p);
#endif

    vec3 ref = normalize(reflect(rd,nor));
    vec3 lightdir = normalize(vec3(0,0.4,1));

    vec3 skyboxCoord = rd;
    vec3 skyboxreflect = ref;

    skyboxCoord.yz *= rot2D(-0.07);
    skyboxreflect.yz *= rot2D(-0.07); 
    
    skyboxCoord.xz *= rot2D(u_time*0.1);
    skyboxreflect.xz *= rot2D(u_time*0.1);




    vec3 skyboxcol = texture(skybox,normalize(skyboxCoord)).xyz;
    vec3 skyboxreflectcol = texture(skybox,normalize(skyboxreflect)).xyz;

    if(inter.y != -1){

    vec3 baseColor = vec3(0.0, 0.2, 0.5);  // A blue-turquoise base color



    //Ambient
    vec3 ambient = vec3(0.1,0.1,0.2);

    //Diffuse
    float diffStrength = max(0,dot(lightdir,nor));
    vec3 diffuse = diffStrength*vec3(0.5, 0.7, 1.0);





    col = (ambient + diffuse ) * baseColor;

    //Speculer
    float speculerStrength =  pow(max(0,dot(ref,lightdir)),32);
    vec3 speculer = speculerStrength * vec3(1,.7,.2) *3;    
   
    //Fresnel Effect
    float fresnel = 0.1 + 0.9*pow(1.0 - max(dot(-rd, nor), 0.0), 5.0);

    col+= speculer * fresnel;

    vec3 refcol = skyboxreflectcol;
    col += refcol * fresnel ;
    

    // Fog
    float fogAmount = inter.x/50;
    col = mix(col,skyboxcol,fogAmount);
   
    



    }
    else{

      
      float height = rd.y;
      vec3 skyTop = vec3(0.5, 0.6, 0.8);
      vec3 skyBottom = vec3(0.8, 0.8, 0.9);
      float maxSkyHeight = 35;
      vec3 skyColor = mix(skyBottom, skyTop, p.y / maxSkyHeight);

      float sun = max(0,dot(rd,lightdir));
      vec3 sunColor = smoothstep(0.8,1.5,max(0,dot(rd,lightdir))) *  mix(vec3(1,.7,.2),skyboxcol,0) ;
      vec3 sunColor1 = smoothstep(0.995,1,max(0,dot(rd,lightdir))) *  mix(vec3(1,.7,.2),skyboxcol,0) ;
      col = skyColor + sunColor;
      

      col = skyboxcol + sunColor1 + sunColor;

    }


    // vignette

    vec2 q=gl_FragCoord.xy/u_resolution.xy; 
    col*=0.2+0.8*pow(16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y),.71);  

    FragColor = vec4(col, 1.0);   
}