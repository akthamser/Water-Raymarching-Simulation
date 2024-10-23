#include"Renderer.h"


Renderer::Renderer(Window& window):m_window(window) {

    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return;
    }
   

    m_shader = new Shader("vertexShader.vert","fragmentShader.frag");
   
    
    //Quad
 

    float vertecies[3*4] = {
    1.0f , 1.0f ,0.0f,
    -1.0f , 1.0f ,0.0f,
    1.0f , -1.0f ,0.0f,
    -1.0f , -1.0f ,0.0f
    };

    unsigned int indicies[2*3] = {
        0,1,2,
        1,2,3

    };


    glGenVertexArrays(1,&VAO);
    glBindVertexArray(VAO);

    glGenBuffers(1, &VBO);
    glBindBuffer(GL_ARRAY_BUFFER,VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertecies), vertecies, GL_STATIC_DRAW);

    glGenBuffers(1, &EBO);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER,EBO);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indicies), indicies, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);

    glBindBuffer(GL_ARRAY_BUFFER,0);

    glBindVertexArray(0);


    //SKYBOX

    std::vector<std::string> faces = {

   "./src/Resources/skybox/FluffballDayLeft.hdr",
   "./src/Resources/skybox/FluffballDayRight.hdr",
   "./src/Resources/skybox/FluffballDayTop.hdr",
   "./src/Resources/skybox/FluffballDayBottom.hdr",
   "./src/Resources/skybox/FluffballDayFront.hdr",
   "./src/Resources/skybox/FluffballDayBack.hdr",

    };

    glGenTextures(1, &cubemapID);
    glBindTexture(GL_TEXTURE_CUBE_MAP,cubemapID);
    int width, height, nrChannels;
    for (int i = 0;i < faces.size();i++) {
        unsigned char* data = stbi_load(faces[i].c_str(),&width,&height,&nrChannels,0);
        if (data){

            glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i
                        ,0,GL_RGB,width,height,0,GL_RGB,GL_UNSIGNED_BYTE,
                         data);
            stbi_image_free(data);
        }
        else {
            std::cout << "failed to load cube map" << std::endl;
            stbi_image_free(data);
        }
    }
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);

    

}

Renderer::~Renderer() {
    delete m_shader;
}

void Renderer::Render() {

    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    m_shader->use();
    m_shader->setVec2("u_resolution", m_window.Width, m_window.Height);
    m_shader->setFloat("u_time", glfwGetTime() / 10);
    glBindTexture(GL_TEXTURE_CUBE_MAP, cubemapID);
    glBindVertexArray(VAO);
    glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
}